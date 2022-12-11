get((data) => {
  let { registeredTabs } = data;

  chrome.runtime.onMessage.addListener(onMessage);
  chrome.tabs.onActivated.addListener((activeInfo) => {
    const { tabId } = activeInfo;
    toggleIcon(tabId);
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    delete registeredTabs[tabId];
    set({ registeredTabs });
  });

  function onMessage(message, sender, sendResponse) {
    console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
    const tab = sender.tab || message.tab;
    const { id: tabId } = tab;
    const { action } = message;
    try {
      if (action === 'fetch') {
        if (isEnabled(tabId)) {
          fetchAsync(tabId, message, sendResponse);
          return true;
        }
      } else if (action === 'ping') {
        if (isRegistered(tabId)) {
          sendResponse(registeredTabs[tabId]);
        } else {
          sendResponse({ enabled: false });
        }
      } else if (action === 'enable') {
        const { port, path } = message;
        enable(tab, port, path);
        sendResponse('success');
      } else if (action === 'disable') {
        disable(tabId);
        sendResponse('success');
      } else {
        sendResponse('not implemented');
      }
    } catch (error) {
      const { message, stack } = error;
      sendResponse({ error: { message, stack } });
    }
  }

  function toggleIcon(tabId) {
    if (isEnabled(tabId)) {
      chrome.action.setIcon({ path: 'icon128.png', tabId });
    } else {
      chrome.action.setIcon({ path: 'disabled-icon128.png', tabId });
    }
  }

  async function fetchAsync(tabId, message, sendResponse) {
    const { src, accept } = message;
    const { port, path } = registeredTabs[tabId];
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

  function isRegistered(tabId) {
    return registeredTabs?.hasOwnProperty(tabId);
  }

  function isEnabled(tabId) {
    return isRegistered(tabId) && registeredTabs[tabId]?.enabled;
  }

  function enable(tab, port, path) {
    const { id: tabId, url } = tab;
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

        registeredTabs = registeredTabs || {};
        registeredTabs[tabId] = { enabled: true, port, path };
        set({ registeredTabs });

        toggleIcon(tabId);

        chrome.tabs.reload(tabId);
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

        registeredTabs = registeredTabs || {};
        registeredTabs[tabId] = { ...registeredTabs[tabId], enabled: false };
        set({ registeredTabs });

        toggleIcon(tabId);

        chrome.tabs.reload(tabId);
      }
    );
  }
});

function get(callback) {
  return chrome.storage.session.get(null, (data) => callback(data));
}

function set(data, callback) {
  return chrome.storage.session.set(data, callback);
}
