import axios from 'axios';

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
  parser: {
    error: "This source doesn't contain valid rss",
  },
};

const xmlParser = (httpResponse) => {
  const parser = new DOMParser();
  return parser.parseFromString(httpResponse.data, 'application/xml');
};

const feedParser = (url) => axios.get(url)
  .then((response) => {
    const doc = xmlParser(response);
    if (doc.documentElement.nodeName === 'parsererror') {
      return errorMessages.parser.error;
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
  .catch(() => {
    console.log(errorMessages.network.error);
    throw new Error(errorMessages.network.error);
  });

export default feedParser;
