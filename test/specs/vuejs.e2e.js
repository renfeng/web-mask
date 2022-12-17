import { expect, $ } from '@wdio/globals';

describe('Web Mask on vuejs', () => {
  const url = 'https://vuejs.org/';
  const port = 5173;
  const path = '/';

  before(async () => {
    await browser.url('chrome://extensions/');
    const webMaskExtensionId = await browser.execute(getExtentionId, 'Web Mask');

    await browser.url(url);

    const webMaskKey = `chrome://extensions/?id=${webMaskExtensionId}`;
    await enableWebMaskAsync(webMaskKey, port, path);
    await isWebMaskReadyAsync(webMaskKey);
  });

  it('should work for vuejs', async () => {
    // See also bin/test.sh
    expect(await browser.execute(() => document.title)).toBe('Web Mask is on! | Vue.js');
  });
});

function getExtentionId(name) {
  return [
    ...document
      .querySelector('extensions-manager')
      .shadowRoot.querySelector('extensions-item-list')
      .shadowRoot.querySelectorAll('extensions-item'),
  ].find((item) => item.shadowRoot.querySelector('#name').innerText === name)?.id;
}

async function enableWebMaskAsync(webMaskKey, port, path) {
  await browser.execute(setStorage, webMaskKey, { port, path, enabled: true });
  await browser.execute(() => location.reload());
}

function setStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

async function isWebMaskReadyAsync(webMaskKey) {
  return browser.executeAsync((webMaskKey, done) => {
    window.addEventListener('message', (event) => {
      const { action, key } = event.data;
      if (action === 'ready' && key === webMaskKey) {
        done();
      }
    });
  }, webMaskKey);
}
