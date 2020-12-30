import axios from 'axios';
import i18next from 'i18next';

const getUrlWithProxy = (url) => `https://api.allorigins.win/raw?url=${url}`;
// const getUrlWithProxy = (url) => `https://cors-anywhere.herokuapp.com/${url}`;

const parseXml = (httpResponse) => {
  const parser = new DOMParser();
  return parser.parseFromString(httpResponse.data, 'application/xml');
};

const makeRequest = (url) => axios.get(getUrlWithProxy(url))
  .then((response) => {
    const document = parseXml(response);
    if (document.documentElement.nodeName === 'parsererror') {
      throw new Error(i18next.t('parserError'));
    }
    return document;
  });

export default makeRequest;
