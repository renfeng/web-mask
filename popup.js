let enableButton = document.getElementById('enableButton');

const page = chrome.extension.getBackgroundPage();

chrome.storage.local.get('careEnabled', function (val) {
  let enabled = val && val.careEnabled;
  enableButton.innerText = enabled ? 'Disable' : 'Enable';
  page.angularInjectionEnabled = enabled;
  chrome.browserAction.setIcon({
    path: enabled ? 'icon128.png' : 'off-icon128.png',
  });
});

chrome.storage.local.get('route', function (val) {
  let route = val && val.route;
  if (route) {
    routeInput.value = route;
  }
});

enableButton.onclick = function (element) {
  chrome.storage.local.get('careEnabled', function (val) {
    let enabled = val && val.careEnabled;
    enabled = !enabled;
    page.angularInjectionEnabled = enabled;
    chrome.storage.local.set({ careEnabled: enabled });
    enableButton.innerText = enabled ? 'Disable' : 'Enable';
    chrome.browserAction.setIcon({
      path: enabled ? 'icon128.png' : 'off-icon128.png',
    });
    setTimeout(function () {
      window.close();
    }, 100);
  });
};
