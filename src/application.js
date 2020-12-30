import i18next from 'i18next';
import * as yup from 'yup';
import _ from 'lodash';
import $ from 'jquery';
import resources from './locales';
import onchange from './view';
import parse from './parser';
import makeRequest from './httpRequest';
import { setId, delay } from './utils';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return '';
  } catch (err) {
    return err.inner[0].message;
  }
};

const updateValidationState = (state) => {
  const processedUrls = state.rssForm.addedUrls.map(({ url }) => url);
  const { url } = state.rssForm.fields;
  const error = processedUrls.includes(url) ? i18next.t('rssExistError') : validate(state.rssForm.fields);
  state.rssForm.validationError = error;
  return error;
};

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    console.log('initialized');
  });

  const state = {
    rssForm: {
      processState: 'initial',
      fields: { url: '' },
      addedUrls: [],
      validationError: '',
    },
    rssData: {
      data: {
        feeds: [],
        posts: [],
        visitedPostsId: [],
      },
      error: null,
    },
  };

  const watchedState = onchange(state);

  const updatePosts = (urls) => {
    const feedParserPromises = urls.map((addedUrl) => {
      const { id, url } = addedUrl;
      return makeRequest(url)
        .then((document) => parse(document))
        .then((feedAndPosts) => {
          const posts = feedAndPosts.slice(1);
          return { feedId: id, posts };
        });
    });

    return Promise.all(feedParserPromises)
      .then((allNewPosts) => {
        const allOldPosts = watchedState.rssData.data.posts;
        watchedState.rssData.data.posts = allNewPosts
          .map((newPosts) => {
            const { feedId } = newPosts;
            const [oldPosts] = allOldPosts.filter((item) => item.feedId === feedId);
            const diff = _.differenceBy(newPosts.posts, oldPosts.posts, 'title');
            const diffWithId = setId(diff);
            const posts = _.concat(diffWithId, oldPosts.posts);
            return { feedId, posts };
          });
      });
  };

  const periodicUpdate = () => delay(5000)
    .then(() => updatePosts(watchedState.rssForm.addedUrls).then(() => periodicUpdate()));

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.rssForm.fields.url = url;
    watchedState.rssForm.processState = 'sent';
    const validationError = updateValidationState(watchedState);
    if (validationError !== '') {
      return;
    }

    makeRequest(url)
      .then((document) => parse(document))
      .then((data) => {
        const [feed, ...posts] = setId(data);
        watchedState.rssData.data.feeds.push(feed);
        watchedState.rssData.data.posts.push({ feedId: feed.id, posts });
        watchedState.rssForm.addedUrls.push({ id: feed.id, url });
        watchedState.rssForm.processState = 'initial';
      })
      .then(periodicUpdate)
      .catch((err) => {
        console.log(err);
        watchedState.rssData.error = err.message === i18next.t('parserError')
          ? i18next.t('parserError') : i18next.t('networkError');
      });
  });

  $('#modal').on('show.bs.modal', (ev) => {
    const btn = ev.relatedTarget;
    const postId = btn.getAttribute('data-id');
    watchedState.rssData.data.visitedPostsId.push(postId);
  });
};
