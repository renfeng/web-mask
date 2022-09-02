chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const {
    tab: { id: tabId },
  } = sender;
  try {
    if (message.action === 'fetch') {
      const url = new URL(message.src, 'http://localhost:PORT');
      fetch(url)
        .then((response) => response.text())
        .then((content) => {
          chrome.tabs.sendMessage(tabId, { action: message.next, content }, (response) => {
            console.debug('response received', response);
          });
        })
        .catch((error) => {
          chrome.tabs.sendMessage(tabId, { action: 'error', content: `${error.message} ${url}` }, (response) => {
            console.debug('response received', response);
          });
        });
      sendResponse('success');
    } else {
      sendResponse('not implemented');
    }
  } catch (error) {
    sendResponse(`error: ${error}`);
  }
});
