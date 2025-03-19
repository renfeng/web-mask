(() => {
  window.addEventListener('message', async (event) => {
    console.debug('message received', event.data);
    if (event.data.action === 'activate-script') {
      const scriptPromises = [];
      activateScript(document.head, event.data.exclude, scriptPromises);
      activateScript(document.body, event.data.exclude, scriptPromises);
      await Promise.all(scriptPromises);
      window.postMessage({ action: 'complete-javascript-injection' }, location.origin);
    }
  });

  async function activateScript(node, exclude, scriptPromises) {
    if (isScript(node)) {
      if (node.src === exclude) {
        return;
      }
      const script = cloneScript(node);
      if (script.src) {
        scriptPromises.push(
          new Promise((resolve, reject) => {
            script.addEventListener('load', resolve);
            script.addEventListener('error', reject);
          }),
        );
      }
      console.info(script.outerHTML);
      node.parentNode.replaceChild(script, node);
    } else {
      for (const child of node.childNodes) {
        activateScript(child, exclude, scriptPromises);
      }
    }
  }

  function cloneScript(node) {
    var script = document.createElement('script');
    script.innerHTML = node.innerHTML;
    for (const attr of node.attributes) {
      script.setAttribute(attr.name, attr.value);
    }
    return script;
  }

  function isScript(node) {
    return node.tagName === 'SCRIPT';
  }
})();
