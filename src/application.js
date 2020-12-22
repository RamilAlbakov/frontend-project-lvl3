import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';
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

const setId = (feedAndPosts, id) => {
  const [feed, ...posts] = feedAndPosts;
  feed.id = id;
  const postsWithId = posts.map((post, i) => {
    post.feedId = id;
    post.id = i;
    return post;
  });
  return { feed, posts: postsWithId };
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

  const updatePosts = (urls) => {
    const feedIds = [];
    const feedParserPromises = urls.map((addedUrl) => {
      const { id, url } = addedUrl;
      feedIds.push(id);
      return feedParser(url);
    });

    Promise.all(feedParserPromises)
      .then((newFeeds) => {
        const allNewPosts = newFeeds
          .map((newFeed, i) => {
            const { posts: newPosts } = setId(newFeed, feedIds[i]);
            return newPosts;
          })
          .flat();

        const allOldPosts = watchedState.rssData.data.posts;
        const updatedPosts = feedIds
          .map((feedId) => {
            const olfPosts = allOldPosts.filter((post) => post.feedId === feedId);
            const newPosts = allNewPosts.filter((post) => post.feedId === feedId);
            const diff = _.differenceBy(newPosts, olfPosts, 'title');
            return _.concat(diff, olfPosts);
          })
          .flat();

        watchedState.rssData.data.posts = updatedPosts;
      });
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

    feedParser(url)
      .then((data) => {
        const { feed, posts } = setId(data, idCounter);
        watchedState.rssData.data.feeds.push(feed);
        const addedPosts = watchedState.rssData.data.posts;
        watchedState.rssData.data.posts = [...addedPosts, ...posts];
        watchedState.rssForm.addedUrls.push({ id: idCounter, url });
        watchedState.rssForm.processState = 'initial';
        idCounter += 1;

        const postsUl = document.querySelector('.posts .list-group');
        postsUl.addEventListener('click', (event) => {
          if ('id' in event.target.dataset) {
            const feedId = event.target.dataset.feedid;
            const postId = event.target.dataset.id;
            const [post] = watchedState.rssData.data.posts
              .filter((p) => p.feedId === Number(feedId) && p.id === Number(postId));
            watchedState.rssData.data.visitedPosts.push(post);
          }
        });

        return { feed, posts };
      })
      .then(() => {
        setTimeout(function update() {
          updatePosts(watchedState.rssForm.addedUrls);
          setTimeout(update, 5000);
        }, 5000);
      })
      .catch((err) => {
        watchedState.rssData.error = err.message;
      });
  });
};
