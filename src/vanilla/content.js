chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender, null, 2)}`);
  try {
    if (message.action === 'html') {
      filterHTML(message.content);
      sendResponse('success');
    } else if (message.action === 'javascript') {
      injectJavascript(message.content);
      sendResponse('success');
    } else if (message.action === 'error') {
      alert(message.content);
      sendResponse('success');
    } else {
      sendResponse('not implemented');
    }
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
});

chrome.runtime.sendMessage({ action: 'fetch', src: location.pathname, accept: 'text/html', replyTo: 'html' }, (response) => {
  if (response) {
    console.debug('response received', JSON.stringify(response, null, 2));
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.runtime.getURL('page.js'));
    document.head.appendChild(script);
  } else if (chrome.runtime.lastError) {
    console.error('error occurred', chrome.runtime.lastError);
  }
});

function filterHTML(html) {
  filter(html.match(/<head\b.*<[/]head>/s)[0], document.head);
  filter(html.match(/<body\b.*<[/]body>/s)[0], document.body);
}

function filter(html, container) {
  filterLinks(html, container);
  filterScripts(html, container);
}

function filterLinks(html, container) {
  Array.from(container.querySelectorAll('link[href]'))
    .filter((node) => isSameOrigin(node.href))
    .forEach((node) => node.remove());
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
  Array.from(container.querySelectorAll('script[src]'))
    .filter((node) => isSameOrigin(node.src))
    .forEach((node) => node.remove());
  html.match(/<script\b.*?><\/script>/g)?.forEach((script) => {
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
      chrome.runtime.sendMessage({ action: 'fetch', src, replyTo: 'javascript' }, callback);
    }
  });
}

function isSameOrigin(url) {
  return new URL(url).origin === location.origin;
}

function callback(response) {
  if (response) {
    console.debug('response received', JSON.stringify(response, null, 2));
  } else if (chrome.runtime.lastError) {
    console.error('error occurred', chrome.runtime.lastError);
  }
}

function injectJavascript(javascript) {
  window.postMessage({ action: 'eval', javascript }, location.origin);
}
