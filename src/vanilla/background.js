const page = chrome.extension.getBackgroundPage();
chrome.storage.local.get('careEnabled', function (val) {
  const enabled = val && val.careEnabled;
  page.angularInjectionEnabled = enabled;
  chrome.browserAction.setIcon({
    path: enabled ? 'icon128.png' : 'off-icon128.png',
  });
});

chrome.webRequest.onBeforeRequest.addListener(
  function (info) {
    return { cancel: page.angularInjectionEnabled };
  },
  {
    urls: ['*://*.swisscom.com/*.js'],
  },
  ['blocking', 'requestBody']
);

page.console.log('Swisscom Angular Frontend Switcher initialized');
