import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';
import $ from 'jquery';
import resources from './locales';
import {
  validationErrorHandler,
  rssErrorHandler,
  renderFeedsAndPosts,
  formProcessStateHandler,
  renderModalDiv,
  renderVisitedLinks,
} from './view';
import feedParser from './parser';

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
  const processedUrl = state.rssForm.addedUrls.map(({ url }) => url);
  const { url } = state.rssForm.fields;
  const error = processedUrl.includes(url) ? i18next.t('rssExistError') : validate(state.rssForm.fields);
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
        visitedPosts: [],
      },
      error: null,
    },
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssForm.validationError':
        validationErrorHandler(value);
        break;
      case 'rssData.error':
        rssErrorHandler(value);
        break;
      case 'rssData.data.feeds':
        renderFeedsAndPosts(value, 'feeds');
        break;
      case 'rssData.data.posts':
        renderFeedsAndPosts(value, 'posts');
        renderVisitedLinks(watchedState.rssData.data.visitedPosts);
        break;
      case 'rssForm.processState':
        formProcessStateHandler(value);
        break;
      case 'rssData.data.visitedPosts':
        renderModalDiv(value[value.length - 1]);
        renderVisitedLinks(value);
        break;
      default:
        break;
    }
  });

  let idCounter = 0;

  const setId = (feedAndPosts) => feedAndPosts.map((item) => {
    item.id = idCounter + 1;
    idCounter += 1;
    return item;
  });

  const updatePosts = (urls) => {
    const feedIds = [];
    const feedParserPromises = urls.map((addedUrl) => {
      const { id, url } = addedUrl;
      feedIds.push(id);
      return feedParser(url);
    });

    return Promise.all(feedParserPromises)
      .then((newFeeds) => {
        const allNewPosts = newFeeds
          .map((newFeed, i) => {
            const newPosts = newFeed.slice(1);
            return { feedId: feedIds[i], posts: newPosts };
          });

        const allOldPosts = watchedState.rssData.data.posts;
        const updatedPosts = feedIds
          .map((feedId) => {
            const [oldPosts] = allOldPosts.filter((item) => item.feedId === feedId);
            const [newPosts] = allNewPosts.filter((item) => item.feedId === feedId);
            const diff = _.differenceBy(newPosts.posts, oldPosts.posts, 'title');
            const diffWithId = setId(diff);
            const posts = _.concat(diffWithId, oldPosts.posts);
            return { feedId, posts };
          });

        watchedState.rssData.data.posts = updatedPosts;
      });
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const periodicUpdate = () => delay(5000)
    .then(() => updatePosts(watchedState.rssForm.addedUrls).then(() => periodicUpdate()));

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.rssForm.fields.url = url;
    const validationError = updateValidationState(watchedState);
    watchedState.rssForm.processState = 'sent';
    if (validationError !== '') {
      return;
    }

    feedParser(url)
      .then((data) => {
        const [feed, ...posts] = setId(data);
        watchedState.rssData.data.feeds.push(feed);
        watchedState.rssData.data.posts.push({ feedId: feed.id, posts });
        watchedState.rssForm.addedUrls.push({ id: feed.id, url });
        watchedState.rssForm.processState = 'initial';
        idCounter += 1;
      })
      .then(() => $('#modal').on('show.bs.modal', (ev) => {
        const btn = ev.relatedTarget;
        const postId = btn.getAttribute('data-id');
        const [post] = watchedState.rssData.data.posts
          .map((item) => item.posts)
          .flat()
          .filter((p) => p.id === Number(postId));

        watchedState.rssData.data.visitedPosts.push(post);
      }))
      .then(periodicUpdate)
      .catch((err) => {
        watchedState.rssData.error = err.message;
      });
  });
};
