import i18next from 'i18next';

const input = document.querySelector('[name=url]');
const feedbackDiv = document.querySelector('.feedback');

export const validationErrorHandler = (error) => {
  if (error) {
    input.classList.add('is-invalid');
    feedbackDiv.classList.remove('text-success');
    feedbackDiv.classList.add('text-danger');
  } else {
    input.classList.remove('is-invalid');
  }
  feedbackDiv.textContent = error;
};

export const formProcessStateHandler = (state) => {
  if (state === 'initial') {
    input.value = null;
    feedbackDiv.classList.remove('text-danger');
    feedbackDiv.classList.add('text-success');
    feedbackDiv.textContent = i18next.t('feedSuccess');
    input.focus();
  }
};

export const rssErrorHandler = (error) => {
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

  const allPosts = posts
    .reverse()
    .map((feedPosts) => feedPosts.posts)
    .flat();

  const liClassList = ['list-group-item', 'd-flex', 'justify-content-between', 'align-items-start'];
  allPosts.forEach((post) => {
    const { title, link } = post;
    const li = document.createElement('li');
    liClassList.forEach((liClass) => {
      li.classList.add(liClass);
    });
    li.innerHTML = `
      <a href="${link}" class="font-weight-bold" target="_blank" rel="noopener noreferrer">${title}</a>
      <button type="button" class="btn btn-primary btn-sm" data-id="2" data-toggle="modal" data-target="#modal">
        ${i18next.t('previewBtnText')}
      </button>`;
    postsUl.append(li);
  });
  return postsUl;
};

const renderPreviewBlock = (e) => {
  e.preventDefault();
  console.log(e.target);
};

export const renderFeedsAndPosts = (data, dataType) => {
  const div = document.querySelector(`.${dataType}`);
  if (div.innerHTML === '') {
    const h2 = document.createElement('h2');
    h2.textContent = dataType === 'feeds' ? i18next.t('feeds') : i18next.t('posts');
    div.append(h2);
    const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
    div.append(ul);

    if (dataType === 'posts') {
      div.addEventListener('click', renderPreviewBlock);
    }

    return;
  }

  const oldUl = document.querySelector(`.${dataType} .list-group`);
  oldUl.parentNode.removeChild(oldUl);
  const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
  div.append(ul);

  if (dataType === 'posts') {
    div.addEventListener('click', renderPreviewBlock);
  }
};
