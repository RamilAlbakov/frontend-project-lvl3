const input = document.querySelector('[name=url]');
const feedbackDiv = document.querySelector('.feedback');

export const inputStateHandler = (state) => {
  switch (state) {
    case 'valid':
      input.classList.remove('is-invalid');
      break;
    case 'initial':
      input.value = null;
      input.focus();
      break;
    default:
      break;
  }
};

export const errorHandler = (error) => {
  input.classList.add('is-invalid');
  feedbackDiv.classList.remove('text-success');
  feedbackDiv.classList.add('text-danger');
  feedbackDiv.textContent = error;
};

const createFeedUl = (feeds) => {
  const feedsUl = document.createElement('ul');
  feedsUl.classList.add('list-group');
  feedsUl.classList.add('mb-5');
  feeds
    .reverse()
    .forEach((feed) => {
      const { title, description } = feed;
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      li.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
      feedsUl.append(li);
    });
  return feedsUl;
};

const createPostsUl = (posts) => {
  const postsUl = document.createElement('ul');
  postsUl.classList.add('list-group');

  const liClassList = ['list-group-item', 'd-flex', 'justify-content-between', 'align-items-start'];
  const allPosts = posts
    .reverse()
    .map((feedPosts) => feedPosts.posts)
    .flat();
  allPosts.forEach((post) => {
    const { title, link } = post;
    const li = document.createElement('li');
    liClassList.forEach((liClass) => {
      li.classList.add(liClass);
    });
    li.innerHTML = `<a href="${link}" class="font-weight-bold" target="_blank" rel="noopener noreferrer">${title}</a>`;
    postsUl.append(li);
  });
  return postsUl;
};

const renderSuccessStatus = () => {
  feedbackDiv.classList.remove('text-danger');
  feedbackDiv.classList.add('text-success');
  feedbackDiv.textContent = 'Rss has been loaded';
};

export const renderFeedsAndPosts = (data, dataType) => {
  const div = document.querySelector(`.${dataType}`);
  if (div.innerHTML === '') {
    const h2 = document.createElement('h2');
    h2.textContent = `${dataType[0].toUpperCase()}${dataType.slice(1)}`;
    div.append(h2);
    const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
    div.append(ul);
    renderSuccessStatus();
    return;
  }

  const oldUl = document.querySelector(`.${dataType} .list-group`);
  oldUl.parentNode.removeChild(oldUl);
  const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
  div.append(ul);
  renderSuccessStatus();
};
