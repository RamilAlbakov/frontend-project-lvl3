const parse = (data) => {
  const titles = data.getElementsByTagName('title');
  const descriptions = data.getElementsByTagName('description');
  const links = data.getElementsByTagName('link');

  return Array.from(titles)
    .map((element, i) => {
      const title = element.textContent;
      const description = descriptions[i].textContent;
      const link = links[i].textContent;
      return { title, description, link };
    });
};

export default parse;
