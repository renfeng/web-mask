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
      const { enabled, path } = response;
      toggleButton.innerText = enabled ? 'Disable' : 'Enable';

      const defaultPath = document.getElementById('default-path');
      if ('/' === path || !path) {
        defaultPath.querySelector('input').setAttribute('checked', 'checked');
      } else {
        defaultPath.querySelector('input').removeAttribute('checked');
      }

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

            const next = `${current}${component}/`;
            if (next === path) {
              clone.querySelector('input').setAttribute('checked', 'checked');
            } else {
              clone.querySelector('input').removeAttribute('checked');
            }
            clone.querySelector('input').value = next;
            clone.querySelector('span').innerText = next;
            defaultPath.parentElement.appendChild(clone);
            return next;
          }, '/');
      }
    } else if (chrome.runtime.lastError) {
      console.error('error occurred', chrome.runtime.lastError);
    }
  });
});
