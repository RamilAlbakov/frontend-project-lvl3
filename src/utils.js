import _ from 'lodash';

export const setId = (feedAndPosts) => feedAndPosts.map((item) => {
  item.id = _.uniqueId();
  return item;
});

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const reverse = (arr) => {
  const newArr = [];
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    newArr.push(arr[i]);
  }
  return newArr;
};
