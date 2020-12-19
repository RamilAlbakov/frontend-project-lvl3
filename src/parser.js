import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

const getUrlWithProxy = (url) => `https://api.allorigins.win/raw?url=${url}`;

const xmlParser = (httpResponse) => {
  const parser = new DOMParser();
  return parser.parseFromString(httpResponse.data, 'application/xml');
};

export const feedParser = (url, id) => axios.get(getUrlWithProxy(url))
  .then((response) => {
    const doc = xmlParser(response);
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error(i18next.t('parserError'));
    }

    const titles = doc.getElementsByTagName('title');
    const descriptions = doc.getElementsByTagName('description');
    const links = doc.getElementsByTagName('link');

    const feedAndPosts = Array.from(titles)
      .map((element, i) => {
        const title = element.textContent;
        const description = descriptions[i].textContent;
        const link = links[i].textContent;
        return { title, description, link };
      });
    const [feed, ...posts] = feedAndPosts;
    feed.id = id;
    return [feed, { feedId: id, posts }];
  })
  .catch((err) => {
    if (err.message === i18next.t('parserError')) {
      throw new Error(i18next.t('parserError'));
    }
    throw new Error(i18next.t('networkError'));
  });

export const updatePosts = (state) => {
  const allUrls = state.rssForm.addedUrls;
  const promises = allUrls.map((addedUrl) => {
    const { id, url } = addedUrl;
    return feedParser(url, id);
  });
  const promise = Promise.all(promises);

  promise
    .then((newFeedsAndPosts) => {
      const newPosts = newFeedsAndPosts.map((newFP) => newFP[1]);
      const oldPosts = state.rssData.data.posts;

      state.rssData.data.posts = oldPosts.map((oldP) => {
        const { feedId, posts } = oldP;
        const { posts: newPost } = newPosts.filter((newP) => newP.feedId === feedId)[0];
        const postsDiff = _.differenceBy(newPost, posts, 'title');
        return { feedId, posts: _.concat(postsDiff, posts) };
      });
    });
};
