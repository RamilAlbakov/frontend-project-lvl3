import i18next from 'i18next';

const input = document.querySelector('[name=url]');
const feedbackDiv = document.querySelector('.feedback');

const reverse = (arr) => {
  const newArr = [];
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    newArr.push(arr[i]);
  }
  return newArr;
};

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
  let ulHtml = '<ul class="list-group mb-5">';

  const reversedFeeds = reverse(feeds);
  reversedFeeds
    .forEach((feed) => {
      const { title, description } = feed;
      const li = `
        <li class="list-group-item">
          <h3>${title}</h3>
          <p>${description}</p>
        </li>`.replace(/\s+/g, ' ').trim();
      ulHtml = `${ulHtml}${li}`;
    });

  return `${ulHtml}</ul>`;
};

const createPostsUl = (data) => {
  const allPosts = reverse(data)
    .map((item) => item.posts)
    .flat();

  let ulHtml = '<ul class="list-group">';
  allPosts.forEach((post) => {
    const { title, link, id } = post;

    const li = `
      <li class="list-group-item d-flex justify-content-between align-items-start">
        <a href="${link}" class="font-weight-bold" target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-primary btn-sm" data-id="${id}" data-toggle="modal" data-target="#modal">
          ${i18next.t('previewBtnText')}
        </button>\
      </li>`.replace(/\s+/g, ' ').trim();

    ulHtml = `${ulHtml}${li}`;
  });
  return `${ulHtml}</ul>`;
};

export const renderFeedsAndPosts = (data, dataType) => {
  const div = document.querySelector(`.${dataType}`);
  const h2TextContent = dataType === 'feeds' ? i18next.t('feeds') : i18next.t('posts');
  const ul = dataType === 'feeds' ? createFeedUl(data) : createPostsUl(data);
  div.innerHTML = `<h2>${h2TextContent}</h2>${ul}`;
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
    const postId = btn.getAttribute('data-id');
    const post = visitedPosts
      .filter((p) => p.id === Number(postId));
    if (post.length > 0) {
      const link = btn.previousElementSibling;
      link.classList.remove('font-weight-bold');
      link.classList.add('font-weight-normal');
    }
  });
};
