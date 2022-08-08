document.addEventListener('DOMNodeInserted', dispatch);

let timeout = null;
function dispatch() {
  clearTimeout(timeout);
  timeout = setTimeout(_dispatch, 500);
}

function _dispatch() {
  Array.from(document.querySelectorAll('img')).forEach(img => {
    const url = new URL(img.src);
    if (url.host === location.host) {
      img.src = chrome.runtime.getURL(url.pathname);
    }
  })
}