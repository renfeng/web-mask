import { expect, $ } from '@wdio/globals';

describe('Web Mask on angular', () => {
  const url = 'https://material.angular.io/';
  const port = 4200;
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
    {
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          {
            header: 'Content-Security-Policy',
            operation: 'remove',
          },
        ],
      },
      condition: {
        regexFilter: `^${new URL(url).origin}/.*`,
        resourceTypes: ['main_frame'],
      },
    },
  ];

  before(async () => {
    await browser.url('chrome://extensions/');
    const webMaskExtensionId = await browser.execute(getExtentionId, 'Web Mask');

    await browser.url(url);

    const webMaskKey = `chrome://extensions/?id=${webMaskExtensionId}`;
    await enableWebMaskAsync(webMaskKey, port, path, rules);
    await isWebMaskReadyAsync(webMaskKey);
  });

  it('should work for angular', async () => {
    // See also bin/test.sh
    expect(await browser.execute(() => document.title)).toBe('Web Mask is on!');
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
