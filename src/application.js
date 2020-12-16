import * as yup from 'yup';
import onChange from 'on-change';
import {
  inputStateHandler, errorHandler, renderFeedsAndPosts,
} from './view';
import feedParser from './parser';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const updateValidationState = (state) => {
  try {
    schema.validateSync(state.rssForm.data, { abortEarly: false });
    state.error = null;
    state.rssForm.state = 'valid';
  } catch (err) {
    state.error = err.inner ? err.inner[0].message : null;
    throw new Error('Wrong url');
  }
};

const generateId = (feedAndPosts, allId) => {
  const id = allId.length + 1;
  allId.push(id);
  const [feed, ...postsArr] = feedAndPosts;
  feed.id = id;
  const posts = { feedId: id, posts: postsArr };
  return [feed, posts];
};

export default () => {
  const state = {
    rssForm: {
      state: 'initial',
      data: { url: '' },
    },
    rssData: {
      feeds: [],
      posts: [],
    },
    addedUrls: [],
    idList: [],
    error: null,
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssForm.state':
        inputStateHandler(value);
        break;
      case 'error':
        errorHandler(value);
        break;
      case 'rssData.feeds':
        renderFeedsAndPosts(value, 'feeds');
        break;
      case 'rssData.posts':
        renderFeedsAndPosts(value, 'posts');
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
    if (watchedState.addedUrls.includes(url)) {
      watchedState.error = 'Rss already exists';
      return;
    }
    watchedState.rssForm.data.url = url;
    try {
      updateValidationState(watchedState);
    } catch (err) {
      return;
    }
    const urlWithProxy = `https://api.allorigins.win/raw?url=${url}`;
    feedParser(urlWithProxy)
      .then((data) => {
        if (typeof data === 'string') {
          watchedState.error = data;
          return;
        }
        const [feed, posts] = generateId(data, watchedState.idList);
        watchedState.rssData.feeds.push(feed);
        watchedState.rssData.posts.push(posts);
        watchedState.addedUrls.push(url);
        watchedState.rssForm.state = 'initial';
      })
      .catch((error) => {
        watchedState.error = error.message;
      });
  });
};
