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
        if (isRegistered(tabId) && isEnabled(tabId)) {
          fetchAsync(tabId, message);
        }
        sendResponse('success');
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
    if (isRegistered(tabId) && isEnabled(tabId)) {
      // known issue: affects other windows
      chrome.action.setIcon({ path: 'icon128.png', tabId });
    } else {
      // known issue: affects other windows
      chrome.action.setIcon({ path: 'disabled-icon128.png', tabId });
    }
  }

  function fetchAsync(tabId, message) {
    const { src, accept, replyTo } = message;
    const { port, path } = registeredTabs[tabId];
    const url = new URL(src, `http://localhost:${port}${path}`);
    fetch(url, { headers: { Accept: accept || '*/*' } })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.statusText);
        }
        return response.text();
      })
      .then((content) => {
        chrome.tabs.sendMessage(tabId, { action: replyTo, content }, (response) => {
          console.debug('response received', JSON.stringify(response, null, 2));
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tabId, { action: 'error', content: `${error.message} ${url}` }, (response) => {
          console.debug('response received', JSON.stringify(response, null, 2));
        });
      });
  }

  function isRegistered(tabId) {
    return registeredTabs?.hasOwnProperty(tabId);
  }

  function isEnabled(tabId) {
    return registeredTabs[tabId]?.enabled;
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
              requestDomains: [domain],
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
