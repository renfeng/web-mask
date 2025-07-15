chrome.runtime.onMessage.addListener(onMessage);

const filter = { urls: ['<all_urls>'] };
chrome.webRequest.onBeforeRequest.addListener((details) => countRequestsAsync({ action: 'add-request', details }), filter);
chrome.webRequest.onBeforeRedirect.addListener((details) => countRequestsAsync({ action: 'remove-request', details }), filter);
chrome.webRequest.onCompleted.addListener((details) => countRequestsAsync({ action: 'remove-request', details }), filter);
chrome.webRequest.onErrorOccurred.addListener((details) => countRequestsAsync({ action: 'remove-request', details }), filter);

function onMessage(message, sender, sendResponse) {
  console.debug(`message received: ${JSON.stringify(message, null, 2)}, ${JSON.stringify(sender)}`);
  const tab = sender.tab || message.tab;
  const { id: tabId } = tab;
  const { action, ...data } = message;
  if (['ping', 'set-state'].includes(action)) {
    forwardMessageAsync(tabId, message, sendResponse);
  } else if (action === 'has-rules') {
    const { rules } = data;
    hasRulesAsync(tabId, rules, sendResponse);
  } else if (action === 'add-rules') {
    const { rules } = data;
    addRulesAsync(tabId, rules, sendResponse);
  } else if (action === 'remove-rules') {
    const { rules } = data;
    removeRulesAsync(tabId, rules, sendResponse);
  }
  return true;
}

async function forwardMessageAsync(tabId, message, sendResponse) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    sendResponse(response);
  } catch (error) {
    const { message, stack } = error;
    sendResponse({ error: { message, stack } });
  }
}

async function hasRulesAsync(tabId, rules, sendResponse) {
  const existingRules = await chrome.declarativeNetRequest.getSessionRules();
  const ruleIds = rules.map((rule) => rule.id);
  const hasRules = existingRules.some(({ id }) => ruleIds.includes(id));
  setIcon(tabId, hasRules);
  sendResponse(hasRules);
}

async function addRulesAsync(tabId, rules, sendResponse) {
  setIcon(tabId, true);
  const availableRuleIds = await getAvailableRuleIdsAsync(rules.length);
  const addRules = rules.map((rule, index) => ({
    ...rule,
    id: availableRuleIds[index],
    condition: { ...rule.condition, tabIds: [tabId] },
  }));
  await chrome.declarativeNetRequest.updateSessionRules({ addRules });
  sendResponse(addRules);
}

async function removeRulesAsync(tabId, rules, sendResponse) {
  setIcon(tabId, false);
  const removeRuleIds = rules.map((rule) => rule.id);
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
  sendResponse();
}

async function getAvailableRuleIdsAsync(count) {
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  const occupiedRuleIds = rules.map((rule) => rule.id);
  const availableRuleIds = [];
  for (let id = 1; id < Math.pow(2, 31); id++) {
    const index = occupiedRuleIds.indexOf(id);
    if (index === -1) {
      availableRuleIds.push(id);
      if (availableRuleIds.length === count) {
        break;
      }
    } else {
      occupiedRuleIds.splice(index, 1);
    }
  }
  if (availableRuleIds.length < count) {
    throw 'Not enough rule ids';
  }
  return availableRuleIds;
}

function setIcon(tabId, enabled) {
  chrome.action.setIcon({ path: enabled ? 'disabled-icon128.png' : 'icon128.png', tabId });
}

async function countRequestsAsync({ action, details }) {
  const { tabId, requestId, url } = details;
  if (tabId === -1) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tabId, { action, requestId, url });
  } catch (error) {
    const { message } = error;
    if (message !== 'Could not establish connection. Receiving end does not exist.') {
      throw message;
    }
  }
}
