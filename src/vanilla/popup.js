chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const toggleButton = document.getElementById('toggle');
  toggleButton.addEventListener('click', () => {
    const action = toggleButton.innerText.toLowerCase();
    const port = document.getElementById('port').value;
    const path = Array.from(document.querySelectorAll('input[name=path]')).find((input) => input.checked).value;
    chrome.runtime.sendMessage({ action, port, path, tab }, (response) => {
      if (response) {
        console.debug('response received', JSON.stringify(response, null, 2));
        if (response.error) {
          alert(response.error.message);
        } else {
          location.reload();
        }
      } else if (chrome.runtime.lastError) {
        console.error('error occurred', chrome.runtime.lastError);
      }
    });
  });

  chrome.runtime.sendMessage({ action: 'ping', tab }, (response) => {
    if (response) {
      console.debug('response received', JSON.stringify(response, null, 2));
      const { enabled, path, port } = response;
      toggleButton.innerText = enabled ? 'Disable' : 'Enable';

      const defaultPath = document.getElementById('default-path');
      const input = defaultPath.querySelector('input');
      if ('/' === path || !path) {
        input.setAttribute('checked', 'checked');
      } else {
        input.removeAttribute('checked');
      }
      input.addEventListener('click', (event) => {
        document.querySelector('.path-text').innerText = event.target.value;
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
              document.querySelector('.path-text').innerText = path;
            } else {
              input.removeAttribute('checked');
            }
            input.value = next;
            input.addEventListener('click', (event) => {
              document.querySelector('.path-text').innerText = event.target.value;
            });

            clone.querySelector('span').innerText = next;
            defaultPath.parentElement.appendChild(clone);
            return next;
          }, '/');
      }

      if (port) {
        document.getElementById('port').value = port;
        document.querySelector('.port-text').innerText = port;
      }
      document.getElementById('port').addEventListener('input', (event) => {
        document.querySelector('.port-text').innerText = event.target.value;
      });
    } else if (chrome.runtime.lastError) {
      console.error('error occurred', chrome.runtime.lastError);
    }
  });
});
