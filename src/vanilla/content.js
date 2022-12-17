const key = `chrome://extensions/?id=${chrome.runtime.id}`;
const state = JSON.parse(sessionStorage.getItem(key)) || {
  port: 0,
  path: '/',
  enabled: false,
};

let requests = {};
let stateSynchronised = false;
let javascriptInjection = new Set();

(async () => {
  const hasRules = await chrome.runtime.sendMessage({ action: 'has-rules' });
  const { port, path, enabled } = state;
  if (enabled) {
    if (!hasRules) {
      await chrome.runtime.sendMessage({ action: 'add-rules', port, path });
    } else {
      injectPageScript();
      await loadHTMLAsync();
      stateSynchronised = true;
    }
  } else if (hasRules) {
    await chrome.runtime.sendMessage({ action: 'remove-rules', port, path });
  } else {
    stateSynchronised = true;
  }
})();

const observer = new MutationObserver((mutationList, observer) => {
  console.log('Mutation', mutationList, observer);
  debounce();
});
observer.observe(document.body, { attributes: true, childList: true, subtree: true });

chrome.runtime.onMessage.addListener(onMessage);

window.addEventListener('message', (event) => {
  console.log('message received', event.data);
  if (event.data.action === 'complete-javascript-injection') {
    javascriptInjection.delete(event.data.src);
  }
});

let timeout = null;
function debounce() {
  if (!state.enabled || !stateSynchronised) {
    return;
  }
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (Object.keys(requests).length > 0) {
      console.log('Pending on requests...', requests);
      setTimeout(debounce, 100);
      return;
    }
    if (javascriptInjection.size > 0) {
      console.log('Pending on javascript...', javascriptInjection);
      setTimeout(debounce, 100);
      return;
    }
    console.log('ready', new Date().toISOString(), document.title);
    window.postMessage({ action: 'ready', key }, location.origin);
  }, 100);
}

function onMessage(message, sender, sendResponse) {
  console.debug(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const { action, ...data } = message;
  try {
    if (action === 'ping') {
      sendResponse(state);
    } else if (action === 'set-state') {
      const { enabled, port, path } = data;
      Object.assign(state, { enabled, port, path });
      sessionStorage.setItem(key, JSON.stringify(state));
      location.reload();
      sendResponse();
    } else if (action === 'add-request') {
      const { requestId } = data;
      requests[requestId] = data;
      debounce();
      sendResponse();
    } else if (action === 'remove-request') {
      const { requestId } = data;
      delete requests[requestId];
      debounce();
      sendResponse();
    }
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
}

async function loadHTMLAsync() {
  const { port, path } = state;
  const src = location.pathname;
  const accept = 'text/html';
  try {
    const response = await fetchAsync({ accept, src, port, path });
    filterHTML(response);
  } catch (error) {
    alert(`${error}: ${src}`);
  }
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
      try {
        const response = await fetchAsync({ src, port, path });
        injectJavascript(src, response);
      } catch (error) {
        alert(`${error}: ${src}`);
      }
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

function injectJavascript(src, javascript) {
  javascriptInjection.add(src);
  window.postMessage({ action: 'eval', src, javascript }, location.origin);
}

async function fetchAsync({ accept, src, port, path }) {
  const response = await chrome.runtime.sendMessage({ action: 'fetch', accept, src, port, path });
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
