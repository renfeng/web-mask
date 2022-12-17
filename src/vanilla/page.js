window.addEventListener('message', (event) => {
  console.debug('message received', event.data);
  if (event.data.action === 'eval') {
    const { src, javascript } = event.data;
    try {
      eval(javascript);
    } finally {
      window.postMessage({ action: 'complete-javascript-injection', src }, location.origin);
    }
  }
});
