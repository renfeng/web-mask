const httpRedirectRuleId = 1;
const websocketRedirectRuleId = 2;

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
          const { src, accept, next } = message;
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
              chrome.tabs.sendMessage(tabId, { action: next, content }, (response) => {
                console.debug('response received', response);
              });
            })
            .catch((error) => {
              chrome.tabs.sendMessage(tabId, { action: 'error', content: `${error.message} ${url}` }, (response) => {
                console.debug('response received', response);
              });
            });
        }
        sendResponse('success');
      } else if (action === 'ping') {
        sendResponse(registeredTabs[tabId] || { enabled: false });
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
      sendResponse(`error: ${error}`);
    }
  }

  function toggleIcon(tabId) {
    if (isRegistered(tabId) && isEnabled(tabId)) {
      // known issue: affects other windows
      chrome.action.setIcon({ path: 'icon128.png' }, tabId);
    } else {
      // known issue: affects other windows
      chrome.action.setIcon({ path: 'disabled-icon128.png' }, tabId);
    }
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
            id: httpRedirectRuleId,
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
              initiatorDomains: [domain],
              resourceTypes: ['script', 'stylesheet', 'image', 'font'],
              tabIds: [tabId],
            },
          },
          {
            id: websocketRedirectRuleId,
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
              initiatorDomains: [domain],
              resourceTypes: ['websocket'],
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
        removeRuleIds: [httpRedirectRuleId, websocketRedirectRuleId],
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
