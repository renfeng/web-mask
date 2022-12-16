const key = `chrome://extensions/?id=${chrome.runtime.id}`;
const state = JSON.parse(sessionStorage.getItem(key)) || {
  port: 0,
  path: '/',
  enabled: false,
};

let requests = {};

(async () => {
  if (state.enabled) {
    const action = 'enable';
    const { port, path } = state;
    const response = await chrome.runtime.sendMessage({ action, port, path });
    if (response) {
      loadHTML();
      injectPageScript();
    }
  }
})();

let timeout = null;
document.addEventListener('DOMNodeInserted', debounce);

chrome.runtime.onMessage.addListener(onMessage);

function debounce() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (Object.keys(requests) > 0) {
      console.log('Pending on requests...', requests);
      setTimeout(debounce, 100);
      return;
    }
    window.postMessage({ action: 'ready', key }, location.origin);
  }, 1000);
  // TODO make timeout duration arbitary
}

function onMessage(message, sender, sendResponse) {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const { action, ...data } = message;
  try {
    if (action === 'ping') {
      sendResponse(state);
    } else if (action === 'enable') {
      const { port, path } = data;
      Object.assign(state, { enabled: true, port, path });
      sessionStorage.setItem(key, JSON.stringify(state));
      location.reload();
      sendResponse('success');
    } else if (action === 'disable') {
      state.enabled = false;
      sessionStorage.setItem(key, JSON.stringify(state));
      location.reload();
      sendResponse('success');
    } else if (action === 'add-request') {
      const { requestId } = data;
      requests[requestId] = data;
    } else if (action === 'remove-request') {
      const { requestId } = data;
      delete requests[requestId];
      if (Object.keys(requests) === 0) {
        debounce();
      }
    }
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
}

async function loadHTML() {
  const { port, path } = state;
  const src = location.pathname;
  const accept = 'text/html';
  const response = await fetchAsync({ accept, src, port, path });
  filterHTML(response);
}

function injectPageScript() {
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL('page.js'));
  document.head.appendChild(script);
}

function filterHTML(html) {
  filter(html.match(/<head\b.*<[/]head>/s)[0], document.head);
  filter(html.match(/<body\b.*<[/]body>/s)[0], document.body);
}

function filter(html, container) {
  filterLinks(html, container);
  filterScripts(html, container);
}

function filterLinks(html, container) {
  removeElement(container, 'link', 'href');
  html.match(/<link\b.*?>/g)?.forEach((link) => {
    const href = link.match(/(?<=href=")(?<href>[^"]+)(?=")/)?.groups['href'];
    if (!href) {
      return;
    }

    const element = document.createElement('link');
    element.href = href;

    const type = link.match(/(?<=type=")(?<type>[^"]+)(?=")/)?.groups['type'];
    if (type) {
      element.type = type;
    }

    const rel = link.match(/(?<=rel=")(?<rel>[^"]+)(?=")/)?.groups['rel'];
    if (rel) {
      element.rel = rel;
    }

    container.appendChild(element);
  });
}

function filterScripts(html, container) {
  removeElement(container, 'script', 'src');
  html.match(/<script\b.*?><\/script>/g)?.forEach(async (script) => {
    const src = script.match(/(?<=src=")(?<src>[^"]+)(?=")/)?.groups['src'];
    if (!src) {
      return;
    }

    const type = script.match(/(?<=type=")(?<type>[^"]+)(?=")/)?.groups['type'];
    if (type === 'module') {
      const element = document.createElement('script');
      element.src = src;
      element.type = 'module';
      container.appendChild(element);
    } else {
      const { port, path } = state;
      const response = await fetchAsync({ src, port, path });
      injectJavascript(response);
    }
  });
}

function removeElement(container, element, attribute) {
  [...container.querySelectorAll(`${element}[${attribute}]`)]
    .filter((node) => isSameOrigin(node[attribute]))
    .forEach((node) => node.remove());
}

function isSameOrigin(url) {
  return new URL(url).origin === location.origin;
}

function injectJavascript(javascript) {
  window.postMessage({ action: 'eval', javascript }, location.origin);
}

async function fetchAsync({ src, accept, port, path }) {
  const response = await chrome.runtime.sendMessage({ action: 'fetch', src, accept, port, path });
  if (chrome.runtime.lastError) {
    const { message } = chrome.runtime.lastError;
    throw message;
  }
  if (response?.error) {
    const { message } = response.error;
    throw message;
  }
  return response;
}
