import { expect, $ } from '@wdio/globals';

describe('Web Mask on react', () => {
  const url = 'https://react.dev/';
  const port = 3000;
  const path = '/';

  // The following are DNR rules. The properties, `id` and `condition.tabIds`, will be added at runtime.
  // See https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#build-rules
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
    const webMaskKey = 'https://react.dev';

    await browser.url(url);

    await enableWebMaskAsync(webMaskKey, port, path, rules);
  });

  it('should work for react', async () => {
    // See also bin/test.sh
    expect(await browser.execute(() => document.title)).toBe('Web Mask is on!');
  });
});

async function enableWebMaskAsync(webMaskKey, port, path, rules) {
  await browser.execute(setStorage, webMaskKey, { port, path, enabled: true, rules });
  await browser.execute(() => location.reload());
}

function setStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}
