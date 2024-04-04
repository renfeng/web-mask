chrome.runtime.onMessage.addListener(onMessage);

const observer = new MutationObserver((mutationList, observer) => {
  console.debug('Mutation', mutationList, observer);
  debounce();
});
observer.observe(document.body, { attributes: true, childList: true, subtree: true });

const key = location.origin;
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
    {
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          {
            header: 'Content-Security-Policy',
            operation: 'remove',
          },
          {
            header: 'Content-Security-Policy-Report-Only',
            operation: 'remove',
          },
        ],
      },
      condition: {
        regexFilter: `^${location.origin}/.*`,
        resourceTypes: ['main_frame', 'sub_frame'],
      },
    },
  ],
};

let requests = {};
let stateSynchronised = false;
let javascriptInjection = false;

(async () => {
  const { enabled, rules } = state;
  const hasRules = await chrome.runtime.sendMessage({ action: 'has-rules', rules });
  if (enabled) {
    if (!hasRules) {
      await addRulesAsync();
    } else {
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
      debounce();
      return;
    }
    if (javascriptInjection) {
      console.log('Pending on javascript...');
      debounce();
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
    if (rule.action.redirect) {
      rule.action.redirect.transform.port = `${port}`;
    }
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
    await filterHTMLAsync(response);
  }
}

async function injectPageScriptAsync() {
  const script = document.createElement('script');
  const promise = new Promise((resolve, reject) => {
    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);
  });
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL('page.js'));
  document.head.appendChild(script);
  return promise;
}

async function filterHTMLAsync(html) {
  const headMatch = html.match(/(?<=<head(?<attributes>(?:\s+\S+="[^"]+")*)>).*(?=<[/]head>)/s);
  const bodyMatch = html.match(/(?<=<body(?<attributes>(?:\s+\S+="[^"]+")*)>).*(?=<[/]body>)/s);

  document.head.innerHTML = headMatch[0];
  document.body.innerHTML = bodyMatch[0];

  const event = await injectPageScriptAsync();

  await activateScriptAsync(event.target.src);
}

async function activateScriptAsync(exclude) {
  javascriptInjection = true;
  window.addEventListener('message', (event) => {
    console.debug('message received', event.data);
    if (event.data.action === 'complete-javascript-injection') {
      javascriptInjection = false;
    }
  });
  window.postMessage({ action: 'activate-script', exclude }, location.origin);
}

async function fetchAsync({ accept, src }) {
  const { port, path } = state;
  const url = `${new URL(src, `http://localhost:${port}${path}`)}`;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'fetch', accept, url });
    if (response?.error) {
      console.error(url, response?.error);
      return null;
    }
    return response;
  } catch (error) {
    console.error(url, error);
    return null;
  }
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
