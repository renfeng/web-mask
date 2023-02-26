window.addEventListener('message', async (event) => {
  console.debug('message received', event.data);
  if (event.data.action === 'eval') {
    const { src, javascript } = event.data;
    try {
      if (javascript.match(/\bimport.meta\b/)) {
        const blob = new Blob([javascript], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        await import(url);
        URL.revokeObjectURL(url);
      } else {
        eval(javascript);
      }
    } finally {
      window.postMessage({ action: 'complete-javascript-injection', src }, location.origin);
    }
  }
});
