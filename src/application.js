import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
// import _ from 'lodash';
import resources from './locales';
import {
  validationErrorHandler, rssErrorHandler, renderFeedsAndPosts, formProcessStateHandler,
} from './view';
import { feedParser, updatePosts } from './parser';

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

  let idCounter = 0;

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

  const periodicUpdate = () => {
    setTimeout(() => {
      updatePosts(watchedState);
      periodicUpdate();
    }, 5000);
  };

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

    feedParser(url, idCounter)
      .then((data) => {
        const [feed, posts] = data;
        watchedState.rssData.data.feeds.push(feed);
        watchedState.rssData.data.posts.push(posts);
        watchedState.rssForm.addedUrls.push({ id: idCounter, url });
        watchedState.rssForm.processState = 'initial';
        idCounter += 1;
      })
      .then(() => periodicUpdate())
      .catch((err) => {
        watchedState.rssData.error = err.message;
      });
  });
};
