const parse = (response, i18Instance) => {
  const httpParser = new DOMParser();
  const data = httpParser.parseFromString(response.data, 'application/xml');
  const parserError = data.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error(i18Instance.t('parserError'));
  }

  const titles = data.getElementsByTagName('title');
  const descriptions = data.getElementsByTagName('description');
  const links = data.getElementsByTagName('link');

  const rssData = Array.from(titles)
    .map((element, i) => {
      const title = element.textContent;
      const description = descriptions[i].textContent;
      const link = links[i].textContent;
      return { title, description, link };
    });

  const [feed, ...posts] = rssData;
  return { feed, posts };
};

export default parse;
