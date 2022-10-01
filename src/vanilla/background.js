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
      if (action === 'ping') {
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
      chrome.action.setIcon({ path: 'icon128.png', tabId });
    } else {
      chrome.action.setIcon({ path: 'disabled-icon128.png', tabId });
    }
  }

  function fetchAsync(tabId, { src, accept, replyTo }) {
    const { port, path } = registeredTabs[tabId];
    const url = new URL(src, `http://localhost:${port}${path}`);
    fetch(url, { headers: { Accept: accept || '*/*' } })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.statusText);
        }
        return response.text();
      })
      .then((content) => replyTo(content))
      .catch((error) => {
        // TODO UI
        console.error(`${error.message} ${url}`);
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

        chrome.tabs.reload(tabId, () => {
          injectPageScript(tabId);
          getPathname(tabId, (src) => {
            fetchAsync(tabId, { src, accept: 'text/html', replyTo: (html) => filterHTML(tabId, html) });
          });
        });
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

  function getPathname(tabId, callback) {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => location.pathname,
      },
      callback
    );
  }

  function injectPageScript(tabId) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', chrome.runtime.getURL('page.js'));
        document.head.appendChild(script);
      },
    });
  }

  function removeElements(tabId, element, attribute, container) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (element, attribute, container) => {
        [...document.querySelector(container).querySelectorAll(`${element}[${attribute}]`)]
          .filter((node) => isSameOrigin(node[attribute]))
          .forEach((node) => node.remove());

        function isSameOrigin(url) {
          return new URL(url).origin === location.origin;
        }
      },
      args: [element, attribute, container],
    });
  }

  function addLink(tabId, { href, type, rel }, container) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (href, type, rel, container) => {
        const element = document.createElement('link');
        element.href = href;

        if (type) {
          element.type = type;
        }

        if (rel) {
          element.rel = rel;
        }

        document.querySelector(container).appendChild(element);
      },
      args: [href, type || null, rel, container],
    });
  }

  function addModuleScript({ src }) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (src) => {
        const element = document.createElement('script');
        element.src = src;
        element.type = 'module';
        document.querySelector(container).appendChild(element);
      },
      args: [src],
    });
  }

  function filterHTML(tabId, html) {
    filter(tabId, html.match(/<head\b.*<[/]head>/s)[0], 'head');
    filter(tabId, html.match(/<body\b.*<[/]body>/s)[0], 'body');
  }

  function filter(tabId, html, container) {
    filterLinks(tabId, html, container);
    filterScripts(tabId, html, container);
  }

  function filterLinks(tabId, html, container) {
    removeElements(tabId, 'link', 'href', container);
    html
      .match(/<link\b.*?>/g)
      ?.map((link) => {
        const href = link.match(/(?<=href=")(?<href>[^"]+)(?=")/)?.groups['href'];
        const type = link.match(/(?<=type=")(?<type>[^"]+)(?=")/)?.groups['type'];
        const rel = link.match(/(?<=rel=")(?<rel>[^"]+)(?=")/)?.groups['rel'];
        return { href, type, rel };
      })
      .filter(({ href }) => href)
      .forEach(({ href, type, rel }) => addLink(tabId, { href, type, rel }, container));
  }

  function filterScripts(tabId, html, container) {
    removeElements(tabId, 'script', 'src', container);
    html
      .match(/<script\b.*?><\/script>/g)
      ?.map((script) => {
        const src = script.match(/(?<=src=")(?<src>[^"]+)(?=")/)?.groups['src'];
        const type = script.match(/(?<=type=")(?<type>[^"]+)(?=")/)?.groups['type'];
        return { src, type };
      })
      .filter(({ src }) => src)
      .forEach(({ src, type }) => {
        if (type === 'module') {
          addModuleScript({ src });
        } else {
          fetchAsync(tabId, { src, replyTo: (javascript) => injectJavascript(tabId, javascript) });
        }
      });
  }

  function injectJavascript(tabId, javascript) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (javascript) => {
        window.postMessage({ action: 'eval', javascript }, location.origin);
      },
      args: [javascript],
    });
  }
});

function get(callback) {
  return chrome.storage.session.get(null, (data) => callback(data));
}

function set(data, callback) {
  return chrome.storage.session.set(data, callback);
}
