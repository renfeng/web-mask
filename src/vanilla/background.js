chrome.runtime.onMessage.addListener(onMessage);

function onMessage(message, sender, sendResponse) {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const tab = sender.tab || message.tab;
  const { id: tabId, url } = tab;
  const { action, data } = message;
  try {
    if (action === 'fetch') {
      const { accept, src, port, path } = data;
      fetchAsync({ accept, src, port, path }, sendResponse);
      return true;
    } else if (action === 'ping') {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, sendResponse);
      return true;
    } else if (action === 'icon') {
      const { enabled } = data;
      setIcon(tabId, enabled);
    } else if (action === 'enable') {
      const { port, path } = data;
      enable(tabId, url, port, path);
      sendResponse('success');
    } else if (action === 'disable') {
      disable(tabId);
      sendResponse('success');
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

function enable(tabId, url, port, path) {
  const domain = new URL(url).host;
  chrome.declarativeNetRequest.updateSessionRules(
    {
      addRules: [
        {
          id: tabId,
          action: {
            type: 'redirect',
            redirect: {
              transform: {
                scheme: 'http',
                host: 'localhost',
                port: `${port}`,
              },
            },
          },
          condition: {
            regexFilter: `^(https|http)://${domain}/.*`,
            resourceTypes: ['script', 'stylesheet', 'image', 'font'],
            tabIds: [tabId],
          },
        },
      ],
    },
    () => {
      console.log(`enabling tab: ${tabId}`);
      chrome.tabs.sendMessage(tabId, { action: 'enable', data: { port, path } });
    }
  );
}

function disable(tabId) {
  chrome.declarativeNetRequest.updateSessionRules(
    {
      removeRuleIds: [tabId],
    },
    () => {
      console.log(`disabling tab: ${tabId}`);
      chrome.tabs.sendMessage(tabId, { action: 'disable' });
    }
  );
}

function setIcon(tabId, enabled) {
  chrome.action.setIcon({ path: enabled ? 'disabled-icon128.png' : 'icon128.png', tabId });
}
