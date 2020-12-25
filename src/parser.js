import axios from 'axios';
import i18next from 'i18next';

const getUrlWithProxy = (url) => `https://cors-anywhere.herokuapp.com/${url}`;

const xmlParser = (httpResponse) => {
  const parser = new DOMParser();
  return parser.parseFromString(httpResponse.data, 'application/xml');
};

const feedParser = (url) => axios.get(getUrlWithProxy(url))
  .then((response) => {
    const doc = xmlParser(response);
    console.log(doc);
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error(i18next.t('parserError'));
    }

    const titles = doc.getElementsByTagName('title');
    const descriptions = doc.getElementsByTagName('description');
    const links = doc.getElementsByTagName('link');

    return Array.from(titles)
      .map((element, i) => {
        const title = element.textContent;
        const description = descriptions[i].textContent;
        const link = links[i].textContent;
        return { title, description, link };
      });
  })
  .catch((err) => {
    if (err.message === i18next.t('parserError')) {
      throw new Error(i18next.t('parserError'));
    }
    throw new Error(i18next.t('networkError'));
  });

export default feedParser;
