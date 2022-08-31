chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender, null, 2)}`);
  try {
    if (message.action === 'html') {
      const { content: html } = message;

      document.head.querySelectorAll('link[href]').forEach((node) => node.remove());
      const head = html.match(/<head>.*<[/]head>/s)[0];
      head.match(/<link\b.*?>/g).forEach((link) => {
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

        document.head.appendChild(element);
      });

      document.body.querySelectorAll('script[src]').forEach((node) => node.remove());
      const body = html.match(/<body>.*<[/]body>/s)[0];
      body.match(/<script\b.*?><\/script>/g).forEach((script) => {
        const src = script.match(/(?<=src=")(?<src>[^"]+)(?=")/)?.groups['src'];
        if (!src) {
          return;
        }

        const type = script.match(/(?<=type=")(?<type>[^"]+)(?=")/)?.groups['type'];
        if (type === 'module') {
          const element = document.createElement('script');
          element.src = src;
          element.type = 'module';
          document.body.appendChild(element);
        } else {
          chrome.runtime.sendMessage({ action: 'fetch', src, next: 'javascript' }, callback);
        }
      });
      sendResponse('success');
    } else if (message.action === 'javascript') {
      const { content: javascript } = message;
      window.postMessage({ action: 'eval', javascript }, location.origin);
    } else {
      sendResponse('not implemented');
    }
  } catch (error) {
    sendResponse(`error: ${error}`);
  }
});

chrome.runtime.sendMessage({ action: 'fetch', src: location.pathname, next: 'html' }, callback);

const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.runtime.getURL('page.js'));
document.head.appendChild(script);

function callback(response) {
  if (response) {
    console.debug('response received', response);
  } else if (chrome.runtime.lastError) {
    console.error('error occurred', chrome.runtime.lastError);
  }
}
