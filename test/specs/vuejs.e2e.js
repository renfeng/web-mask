import { expect, $ } from '@wdio/globals';

describe('Web Mask on vuejs', () => {
  const url = 'https://vuejs.org/';
  const port = 5173;
  const path = '/';
  const rules = [
    {
      action: {
        type: 'redirect',
        redirect: {
          transform: { scheme: 'http', host: 'localhost', port: `${port}` },
        },
      },
      condition: {
        regexFilter: `^${new URL(url).origin}/.*`,
        resourceTypes: ['script', 'stylesheet', 'image', 'font'],
      },
    },
  ];

  before(async () => {
    const webMaskKey = 'https://vuejs.org';

    await browser.url(url);

    await enableWebMaskAsync(webMaskKey, port, path, rules);
    await isWebMaskReadyAsync(webMaskKey);
  });

  it('should work for vuejs', async () => {
    // See also bin/test.sh
    expect(await browser.execute(() => document.title)).toBe('Web Mask is on! | Vue.js');
  });
});

async function enableWebMaskAsync(webMaskKey, port, path, rules) {
  await browser.execute(setStorage, webMaskKey, { port, path, enabled: true, rules });
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
