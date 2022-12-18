chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  const { id, url } = tab;
  if (url) {
    document.getElementById('enabled').style.display = 'initial';
  } else {
    document.getElementById('disabled').style.display = 'initial';
  }
  document.getElementById('splash').style.display = 'none';

  const toggleButton = document.getElementById('toggle');
  toggleButton.addEventListener('click', async () => {
    toggleButton.disabled = true;
    const port = parseInt(document.getElementById('port').value);
    const path = [...document.querySelectorAll('input[name=path]')].find((input) => input.checked).value;
    const enabled = toggleButton.innerText === 'Enable';
    const response = await chrome.runtime.sendMessage({ action: 'set-state', port, path, enabled, tab: { id } });
    if (chrome.runtime.lastError) {
      alert(`error occurred: ${chrome.runtime.lastError}`);
      return;
    }
    console.debug('response received', JSON.stringify(response, null, 2));
    if (response?.error) {
      alert(`error occurred: ${response.error.message}`);
    } else {
      location.reload();
    }
  });

  const response = await chrome.runtime.sendMessage({ action: 'ping', tab: { id } });
  if (chrome.runtime.lastError) {
    alert(`error occurred: ${chrome.runtime.lastError}`);
    return;
  }
  console.debug('response received', JSON.stringify(response, null, 2));
  const { port, path, enabled } = response;
  toggleButton.innerText = enabled ? 'Disable' : 'Enable';
  toggleButton.disabled = false;

  const defaultPath = document.getElementById('default-path');
  const input = defaultPath.querySelector('input');
  if ('/' === path || !path) {
    input.setAttribute('checked', 'checked');
  } else {
    input.removeAttribute('checked');
  }
  input.addEventListener('click', (event) => {
    document.getElementById('path-text').innerText = event.target.value;
  });

  if (tab.url) {
    new URL(tab.url).pathname
      .split('/')
      .slice(1)
      .map((component) => `${component}`)
      .reduce((current, component) => {
        if (component === '') {
          return current;
        }
        const deep = true;
        const clone = defaultPath.cloneNode(deep);
        clone.removeAttribute('id');

        const input = clone.querySelector('input');
        const next = `${current}${component}/`;
        if (next === path) {
          input.setAttribute('checked', 'checked');
          document.getElementById('path-text').innerText = path;
        } else {
          input.removeAttribute('checked');
        }
        input.value = next;
        input.addEventListener('click', (event) => {
          document.getElementById('path-text').innerText = event.target.value;
        });

        clone.querySelector('span').innerText = next;
        defaultPath.parentElement.appendChild(clone);
        return next;
      }, '/');
  }

  if (port) {
    document.getElementById('port').value = port;
    document.getElementById('port-text').innerText = port;
  }
  document.getElementById('port').addEventListener('input', (event) => {
    document.getElementById('port-text').innerText = event.target.value;
  });
});
