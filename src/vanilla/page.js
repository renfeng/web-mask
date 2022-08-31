window.addEventListener('message', (event) => {
  console.debug('message received', event.data);
  if (event.data.action === 'eval') {
    eval(event.data.javascript);
  }
});
