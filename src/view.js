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

  const allPosts = posts.sort((a, b) => b.feedId - a.feedId);

  const liClassList = ['list-group-item', 'd-flex', 'justify-content-between', 'align-items-start'];
  allPosts.forEach((post) => {
    const {
      title, link, feedId, id,
    } = post;
    const li = document.createElement('li');
    liClassList.forEach((liClass) => {
      li.classList.add(liClass);
    });
    li.innerHTML = `
      <a href="${link}" class="font-weight-bold" target="_blank" rel="noopener noreferrer">${title}</a>
      <button type="button" class="btn btn-primary btn-sm" data-feedid="${feedId}" data-id="${id}" data-toggle="modal" data-target="#modal">
          ${i18next.t('previewBtnText')}
      </button>`.trim();
    postsUl.append(li);
  });
  return postsUl;
};

export const renderFeedsAndPosts = (data, dataType) => {
  const div = document.querySelector(`.${dataType}`);
  div.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.textContent = dataType === 'feeds' ? i18next.t('feeds') : i18next.t('posts');
  div.append(h2);
  const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
  div.append(ul);
};

export const renderModalDiv = (post) => {
  const { title, description, link } = post;
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = title;
  const modalBody = document.querySelector('.modal-body');
  modalBody.textContent = description;
  const btnFullArticle = document.querySelector('.full-article');
  btnFullArticle.setAttribute('href', link);
  btnFullArticle.textContent = i18next.t('modalBtnFullArticle');
};

export const renderVisitedLinks = (visitedPosts) => {
  const allPostPreviewBtns = document.querySelectorAll('.posts .btn');
  allPostPreviewBtns.forEach((btn) => {
    const feedId = btn.getAttribute('data-feedid');
    const postId = btn.getAttribute('data-id');
    const post = visitedPosts
      .filter((p) => p.feedId === Number(feedId) && p.id === Number(postId));
    if (post.length > 0) {
      const link = btn.previousElementSibling;
      link.classList.remove('font-weight-bold');
      link.classList.add('font-weight-normal');
    }
  });
};
