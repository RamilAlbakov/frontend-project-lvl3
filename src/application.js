import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import resources from './locales';
import {
  validationErrorHandler, rssErrorHandler, renderFeedsAndPosts, formProcessStateHandler,
} from './view';
import feedParser from './parser';

let idCounter = 0;

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
  const processedUrl = state.rssForm.addedUrls;
  const { url } = state.rssForm.fields;
  const error = processedUrl.includes(url) ? i18next.t('rssExistError') : validate(state.rssForm.fields);
  state.rssForm.validationError = error;
  return error;
};

const generateId = (feedAndPosts) => {
  idCounter += 1;
  const [feed, ...postsArr] = feedAndPosts;
  feed.id = idCounter;
  const posts = { feedId: idCounter, posts: postsArr };
  return [feed, posts];
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
        break;
      case 'rssForm.processState':
        formProcessStateHandler(value);
        break;
      default:
        break;
    }
  });

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

    const urlWithProxy = `https://api.allorigins.win/raw?url=${url}`;
    feedParser(urlWithProxy)
      .then((data) => {
        const [feed, posts] = generateId(data);
        watchedState.rssData.data.feeds.push(feed);
        watchedState.rssData.data.posts.push(posts);
        watchedState.rssForm.addedUrls.push(url);
        watchedState.rssForm.processState = 'initial';
      })
      .catch((err) => {
        watchedState.rssData.error = err.message;
      });
  });
};
