chrome.runtime.onMessage.addListener(onMessage);

window.addEventListener('message', (event) => {
  console.log('message received', event.data);
  if (event.data.action === 'complete-javascript-injection') {
    javascriptInjection.delete(event.data.src);
  }
});

const observer = new MutationObserver((mutationList, observer) => {
  console.log('Mutation', mutationList, observer);
  debounce();
});
observer.observe(document.body, { attributes: true, childList: true, subtree: true });

const key = `chrome://extensions/?id=${chrome.runtime.id}`;
const state = JSON.parse(sessionStorage.getItem(key)) || {
  port: 0,
  path: '/',
  enabled: false,
  rules: [
    {
      action: {
        type: 'redirect',
        redirect: {
          transform: { scheme: 'http', host: 'localhost', port: '0' },
        },
      },
      condition: {
        regexFilter: `^${location.origin}/.*`,
        resourceTypes: ['script', 'stylesheet', 'image', 'font'],
      },
    },
  ],
};

let requests = {};
let stateSynchronised = false;
let javascriptInjection = new Set();

(async () => {
  const { enabled, rules } = state;
  const hasRules = await chrome.runtime.sendMessage({ action: 'has-rules', rules });
  if (enabled) {
    if (!hasRules) {
      await addRulesAsync();
    } else {
      injectPageScript();
      await loadHTMLAsync();
      stateSynchronised = true;
    }
  } else if (hasRules) {
    await removeRulesAsync();
  } else {
    stateSynchronised = true;
  }
})();

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
      const { port, path, enabled } = data;
      setState(port, path, enabled);
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

function setState(port, path, enabled) {
  const rules = state.rules.map((rule) => {
    rule.action.redirect.transform.port = `${port}`;
    return rule;
  });
  Object.assign(state, { port, path, enabled, rules });
  sessionStorage.setItem(key, JSON.stringify(state));
  location.reload();
}

async function loadHTMLAsync() {
  const src = location.pathname;
  const accept = 'text/html';
  const response = await fetchAsync({ accept, src });
  if (response) {
    filterHTML(response);
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
      const response = await fetchAsync({ src });
      if (response) {
        injectJavascript(src, response);
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

async function fetchAsync({ accept, src }) {
  const { port, path } = state;
  const url = new URL(src, `http://localhost:${port}${path}`);
  const response = await chrome.runtime.sendMessage({ action: 'fetch', accept, url });
  if (chrome.runtime.lastError) {
    const { message } = chrome.runtime.lastError;
    console.error(`${message}: ${url}`);
    return null;
  }
  if (response?.error) {
    const { message } = response.error;
    console.error(`${message}: ${url}`);
    return null;
  }
  return response;
}

async function addRulesAsync() {
  const rules = await chrome.runtime.sendMessage({ action: 'add-rules', rules: state.rules });
  Object.assign(state, { rules });
  sessionStorage.setItem(key, JSON.stringify(state));
  location.reload();
}

async function removeRulesAsync() {
  const { rules } = state;
  await chrome.runtime.sendMessage({ action: 'remove-rules', rules });
  location.reload();
}
