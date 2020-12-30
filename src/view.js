import i18next from 'i18next';
import onChange from 'on-change';
import { reverse } from './utils';

const validationErrorHandler = (error) => {
  const input = document.querySelector('[name=url]');
  const feedbackDiv = document.querySelector('.feedback');
  const addBtn = document.querySelector('[type="submit"]');
  if (error) {
    input.classList.add('is-invalid');
    feedbackDiv.classList.remove('text-success');
    feedbackDiv.classList.add('text-danger');
  } else {
    input.classList.remove('is-invalid');
  }
  feedbackDiv.textContent = error;
  addBtn.disabled = false;
};

const formProcessStateHandler = (state) => {
  const input = document.querySelector('[name=url]');
  const feedbackDiv = document.querySelector('.feedback');
  const addBtn = document.querySelector('[type="submit"]');
  if (state === 'initial') {
    input.value = null;
    feedbackDiv.classList.remove('text-danger');
    feedbackDiv.classList.add('text-success');
    feedbackDiv.textContent = i18next.t('feedSuccess');
    input.focus();
    addBtn.disabled = false;
  }
  if (state === 'sent') {
    addBtn.disabled = true;
  }
};

const rssErrorHandler = (error) => {
  const feedbackDiv = document.querySelector('.feedback');
  const addBtn = document.querySelector('[type="submit"]');
  feedbackDiv.classList.remove('text-success');
  feedbackDiv.classList.add('text-danger');
  feedbackDiv.textContent = error;
  addBtn.disabled = false;
};

const createFeedUl = (feeds) => {
  const reversedFeeds = reverse(feeds);

  const liHtml = reversedFeeds
    .map((feed) => {
      const { title, description } = feed;
      return `
        <li class="list-group-item">
          <h3>${title}</h3>
          <p>${description}</p>
        </li>`.trim();
    })
    .join('\n');

  return `<ul class="list-group mb-5">${liHtml}</ul>`;
};

const createPostsUl = (data) => {
  const allPosts = reverse(data).flatMap((item) => item.posts);

  const liHtml = allPosts
    .map((post) => {
      const { title, link, id } = post;
      return `
        <li class="list-group-item d-flex justify-content-between align-items-start">
          <a href="${link}" class="font-weight-bold" target="_blank" rel="noopener noreferrer">${title}</a>
          <button type="button" class="btn btn-primary btn-sm" data-id="${id}" data-toggle="modal" data-target="#modal">
            ${i18next.t('previewBtnText')}
          </button>
        </li>`.trim();
    })
    .join('\n');

  return `<ul class="list-group">${liHtml}</ul>`;
};

const renderFeedsAndPosts = (data, dataType) => {
  const div = document.querySelector(`.${dataType}`);
  const h2TextContent = dataType === 'feeds' ? i18next.t('feeds') : i18next.t('posts');
  const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
  div.innerHTML = `<h2>${h2TextContent}</h2>${ul}`;
};

const renderModalDiv = (postId, posts) => {
  const [post] = posts
    .flatMap((item) => item.posts)
    .filter((p) => p.id === postId);
  const { title, description, link } = post;
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = title;
  const modalBody = document.querySelector('.modal-body');
  modalBody.textContent = description;
  const btnFullArticle = document.querySelector('.full-article');
  btnFullArticle.setAttribute('href', link);
  btnFullArticle.textContent = i18next.t('modalBtnFullArticle');
};

const renderVisitedLinks = (visitedPostsId) => {
  const allPostPreviewBtns = document.querySelectorAll('.posts .btn');
  allPostPreviewBtns.forEach((btn) => {
    const postId = btn.getAttribute('data-id');
    const ids = visitedPostsId
      .filter((id) => id === postId);
    if (ids.length > 0) {
      const link = btn.previousElementSibling;
      link.classList.remove('font-weight-bold');
      link.classList.add('font-weight-normal');
    }
  });
};

export default (state) => onChange(state, (path, value) => {
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
      renderVisitedLinks(state.rssData.data.visitedPostsId);
      break;
    case 'rssForm.processState':
      formProcessStateHandler(value);
      break;
    case 'rssData.data.visitedPostsId':
      renderModalDiv(value[value.length - 1], state.rssData.data.posts);
      renderVisitedLinks(value);
      break;
    default:
      break;
  }
});
