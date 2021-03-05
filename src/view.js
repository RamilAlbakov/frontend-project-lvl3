import onChange from 'on-change';

export const processStates = {
  initial: 'initial',
  submitting: 'submitting',
};

const validationErrorHandler = (error, elements) => {
  if (error) {
    elements.input.classList.add('is-invalid');
    elements.feedbackDiv.classList.remove('text-success');
    elements.feedbackDiv.classList.add('text-danger');
  } else {
    elements.input.classList.remove('is-invalid');
  }
  elements.feedbackDiv.textContent = error;
  elements.addBtn.disabled = false;
};

const formProcessStateHandler = (state, elements, i18Instance) => {
  if (state === processStates.initial) {
    elements.input.value = null;
    elements.feedbackDiv.classList.remove('text-danger');
    elements.feedbackDiv.classList.add('text-success');
    elements.feedbackDiv.textContent = i18Instance.t('feedSuccess');
    elements.input.focus();
    elements.addBtn.disabled = false;
  }
  if (state === processStates.submitting) {
    elements.addBtn.disabled = true;
  }
};

const rssErrorHandler = (error, elements) => {
  if (error) {
    elements.feedbackDiv.classList.remove('text-success');
    elements.feedbackDiv.classList.add('text-danger');
  }
  elements.feedbackDiv.textContent = error;
  elements.addBtn.disabled = false;
};

const createFeedUl = (feeds) => {
  const reversedFeeds = [...feeds].reverse();

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

const createPostsUl = (data, i18Instance) => {
  const allPosts = [...data]
    .reverse()
    .flatMap((item) => item.posts);

  const liHtml = allPosts
    .map((post) => {
      const { title, link, id } = post;
      return `
        <li class="list-group-item d-flex justify-content-between align-items-start">
          <a href="${link}" class="font-weight-bold" target="_blank" data-id="${id}" rel="noopener noreferrer">${title}</a>
          <button type="button" class="btn btn-primary btn-sm" data-id="${id}" data-toggle="modal" data-target="#modal">
            ${i18Instance.t('previewBtnText')}
          </button>
        </li>`.trim();
    })
    .join('\n');

  return `<ul class="list-group">${liHtml}</ul>`;
};

const renderFeedsAndPosts = (data, dataType, elements, i18Instance) => {
  let div;
  let h2TextContent;
  let ul;

  if (dataType === 'feeds') {
    div = elements.feedsDiv;
    h2TextContent = i18Instance.t('feeds');
    ul = createFeedUl(data);
  } else if (dataType === 'posts') {
    div = elements.postsDiv;
    h2TextContent = i18Instance.t('posts');
    ul = createPostsUl(data, i18Instance);
  }

  div.innerHTML = `<h2>${h2TextContent}</h2>${ul}`;
};

const renderModalDiv = (postId, posts, elements, i18Instance) => {
  const [post] = posts
    .flatMap((item) => item.posts)
    .filter((p) => p.id === postId);
  const { title, description, link } = post;
  elements.modalTitle.textContent = title;
  elements.modalBody.textContent = description;
  elements.btnFullArticle.setAttribute('href', link);
  elements.btnFullArticle.textContent = i18Instance.t('modalBtnFullArticle');
  elements.btnClosePreview.textContent = i18Instance.t('closePreview');
};

const renderVisitedLinks = (visitedPostsIds) => {
  const allPostPreviewBtns = document.querySelectorAll('.posts .btn');
  allPostPreviewBtns.forEach((btn) => {
    const postId = btn.getAttribute('data-id');
    const ids = visitedPostsIds
      .filter((id) => id === postId);
    if (ids.length > 0) {
      const link = btn.previousElementSibling;
      link.classList.remove('font-weight-bold');
      link.classList.add('font-weight-normal');
    }
  });
};

export const onchange = (state, elements, i18Instance) => onChange(state, (path, value) => {
  switch (path) {
    case 'rssForm.validationError':
      validationErrorHandler(value, elements);
      break;
    case 'rssData.error':
      rssErrorHandler(value, elements);
      break;
    case 'rssData.feeds':
      renderFeedsAndPosts(value, 'feeds', elements, i18Instance);
      break;
    case 'rssData.posts':
      renderFeedsAndPosts(value, 'posts', elements, i18Instance);
      renderVisitedLinks(state.rssData.visitedPostsIds);
      break;
    case 'rssForm.processState':
      formProcessStateHandler(value, elements, i18Instance);
      break;
    case 'rssData.visitedPostsIds':
      renderVisitedLinks(value);
      break;
    case 'modalPostId':
      renderModalDiv(value, state.rssData.posts, elements, i18Instance);
      break;
    default:
      break;
  }
});
