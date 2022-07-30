chrome.storage.local.get('careEnabled', function (val) {
  if (val && val.careEnabled) {
    console.info('### WARNING ###');
    console.info('Injected Local Angular Scripts!');

    fetch('http://localhost:4200/index.html').then((response) => {
      response.text().then(function (text) {
        const regex = /<script.*?src="(.*?)".*?>/gim;
        let matches;
        while ((matches = regex.exec(text))) {
          const script = matches[0];
          const src = matches[1];
          const noModule = script.includes('nomodule');
          if (src.indexOf('sc-shared-header') < 0) {
            console.log('injecting', script);
            injectScript(new URL(src, 'http://localhost:4200').href, noModule);
          }
        }
      });
    });
  }
});

function injectScript(src, noModule) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    if (noModule) {
      script.noModule = true;
    }
    script.addEventListener('load', resolve);
    script.addEventListener('error', () => reject('Error loading script.'));
    script.addEventListener('abort', () => reject('Script loading aborted.'));
    document.head.appendChild(script);
  });
}
