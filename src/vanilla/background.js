chrome.runtime.onMessage.addListener(onMessage);

const filter = { urls: ['<all_urls>'] };
chrome.webRequest.onBeforeRequest.addListener((details) => countRequestsAsync({ action: 'add-request', ...details }), filter);
chrome.webRequest.onCompleted.addListener((details) => countRequestsAsync({ action: 'remove-request', ...details }), filter);
chrome.webRequest.onErrorOccurred.addListener((details) => countRequestsAsync({ action: 'remove-request', ...details }), filter);

function onMessage(message, sender, sendResponse) {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const tab = sender.tab || message.tab;
  const { id: tabId, url } = tab;
  const { action, ...data } = message;
  try {
    if (action === 'fetch') {
      const { accept, src, port, path } = data;
      fetchAsync({ accept, src, port, path }, sendResponse);
      return true;
    } else if (action === 'ping') {
      pingAsync(tabId, sendResponse);
      return true;
    } else if (action === 'enable') {
      const { port, path } = data;
      enableAsync(tabId, url, port, path, sendResponse);
      return true;
    } else if (action === 'disable') {
      disableAsync(tabId, sendResponse);
      return true;
    }
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
}

async function fetchAsync({ src, accept, port, path }, sendResponse) {
  const url = new URL(src, `http://localhost:${port}${path}`);
  try {
    const response = await fetch(url, { headers: { Accept: accept || '*/*' } });
    if (response.status >= 400) {
      sendResponse({ error: { message: response.statusText } });
    }
    const content = await response.text();
    sendResponse(content);
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
}

async function pingAsync(tabId, sendResponse) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    sendResponse(response);
  } catch (error) {
    const { message } = error;
    if (message === 'Could not establish connection. Receiving end does not exist.') {
      pingAsync(tabId, sendResponse);
    } else {
      throw message;
    }
  }
}

async function enableAsync(tabId, url, port, path, sendResponse) {
  setIcon(tabId, true);
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  if (rules.find((rule) => rule.id === tabId)) {
    sendResponse(true);
    return;
  }
  const domain = new URL(url).host;
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: tabId,
        action: {
          type: 'redirect',
          redirect: {
            transform: { scheme: 'http', host: 'localhost', port: `${port}` },
          },
        },
        condition: {
          regexFilter: `^(https|http)://${domain}/.*`,
          resourceTypes: ['script', 'stylesheet', 'image', 'font'],
          tabIds: [tabId],
        },
      },
    ],
  });
  console.log(`enabling tab: ${tabId}`);
  chrome.tabs.sendMessage(tabId, { action: 'enable', port, path });
  sendResponse(false);
}

async function disableAsync(tabId, sendResponse) {
  setIcon(tabId, true);
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] });
  console.log(`disabling tab: ${tabId}`);
  chrome.tabs.sendMessage(tabId, { action: 'disable' }, sendResponse);
}

function setIcon(tabId, enabled) {
  chrome.action.setIcon({ path: enabled ? 'disabled-icon128.png' : 'icon128.png', tabId });
}

async function countRequestsAsync({ action, ...data }) {
  const { tabId } = data;
  if (tabId === -1) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tabId, { action, ...data });
  } catch (error) {
    const { message } = error;
    if (message !== 'Could not establish connection. Receiving end does not exist.') {
      throw message;
    }
  }
}
