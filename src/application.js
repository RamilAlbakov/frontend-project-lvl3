import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import $ from 'jquery';
import resources from './locales';
import { onchange, processStates } from './view';
import parse from './parser';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const validate = (state) => {
  const { url } = state.rssForm;
  const processedUrls = state.rssForm.addedUrls.map((addedUrl) => addedUrl.url);
  try {
    schema.validateSync({ url }, { abortEarly: false });
    return processedUrls.includes(url) ? i18next.t('rssExistError') : '';
  } catch (err) {
    return i18next.t('invalidURL');
  }
};

export default () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => {
    console.log('initialized');
  });

  const state = {
    rssForm: {
      url: '',
      addedUrls: [],
      valid: true,
      processState: processStates.initial,
      validationError: '',
    },
    rssData: {
      feeds: [],
      posts: [],
      visitedPostsIds: [],
      error: null,
    },
  };

  const elements = {
    input: document.querySelector('[name=url]'),
    feedbackDiv: document.querySelector('.feedback'),
    addBtn: document.querySelector('[type="submit"]'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    btnFullArticle: document.querySelector('.full-article'),
    btnClosePreview: document.querySelector('.close-preview'),
    feedsDiv: document.querySelector('.feeds'),
    postsDiv: document.querySelector('.posts'),
  };

  const getUrlWithProxy = (url) => `https://api.allorigins.win/raw?url=${url}`;
  // const getUrlWithProxy = (url) => `https://thingproxy.freeboard.io/fetch/${url}`;

  const watchedState = onchange(state, elements);

  const setId = (data) => data.map((item) => {
    item.id = _.uniqueId();
    return item;
  });

  const updatePosts = (urls) => {
    const newPostsPromises = urls.map((addedUrl) => {
      const { id, url } = addedUrl;
      return axios.get(getUrlWithProxy(url))
        .then((response) => parse(response))
        .then((rssData) => {
          const { posts } = rssData;
          return { feedId: id, posts };
        });
    });

    return Promise.all(newPostsPromises)
      .then((allNewPosts) => {
        const allOldPosts = watchedState.rssData.posts;
        watchedState.rssData.posts = allNewPosts
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

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.rssForm.processState = processStates.submitting;
    const formData = new FormData(e.target);
    const url = formData.get('url');
    watchedState.rssForm.url = url;
    watchedState.rssForm.validationError = validate(watchedState);
    if (watchedState.rssForm.validationError === '') {
      watchedState.rssForm.valid = true;
    } else {
      watchedState.rssForm.valid = false;
      return;
    }

    axios.get(getUrlWithProxy(url))
      .then((response) => parse(response))
      .then((data) => {
        const { feed, posts } = data;
        feed.id = _.uniqueId();
        watchedState.rssData.feeds.push(feed);
        watchedState.rssData.posts.push({ feedId: feed.id, posts: setId(posts) });
        watchedState.rssForm.addedUrls.push({ id: feed.id, url });
        watchedState.rssData.error = '';
        watchedState.rssForm.processState = processStates.initial;
      })
      .then(() => setTimeout(function update() {
        updatePosts(watchedState.rssForm.addedUrls).then(() => setTimeout(update, 5000));
      }, 5000))
      .catch((err) => {
        watchedState.rssData.error = err.message === i18next.t('parserError')
          ? i18next.t('parserError') : i18next.t('networkError');
      });
  });

  $('#modal').on('show.bs.modal', (ev) => {
    const btn = ev.relatedTarget;
    const postId = btn.getAttribute('data-id');
    watchedState.rssData.visitedPostsIds.push(postId);
  });
};
