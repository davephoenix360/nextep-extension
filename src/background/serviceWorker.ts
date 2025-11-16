import { createApplicationEntryFromPage } from '../logic/applicationEntries';

interface CreateApplicationMessage {
  type: 'CREATE_APPLICATION_FROM_ACTIVE_TAB';
}

interface RunAutofillMessage {
  type: 'RUN_AUTOFILL_IN_ACTIVE_TAB';
  applicationEntryId: string;
}

type BackgroundMessage = CreateApplicationMessage | RunAutofillMessage;

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  if (message.type === 'CREATE_APPLICATION_FROM_ACTIVE_TAB') {
    void handleCreateApplication().then(sendResponse);
    return true;
  }
  if (message.type === 'RUN_AUTOFILL_IN_ACTIVE_TAB') {
    void handleRunAutofill(message.applicationEntryId).then(sendResponse);
    return true;
  }
  return undefined;
});

/**
 * Returns the currently active tab in the focused window.
 */
async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Captures the DOM from the active tab and persists a new application entry.
 */
async function handleCreateApplication() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, reason: 'NO_ACTIVE_TAB' as const };
  }

  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML
    });

    const html = (injectionResults[0]?.result as string) ?? '';
    if (!html) {
      return { ok: false, reason: 'EMPTY_PAGE' as const };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const entry = await createApplicationEntryFromPage(tab.url ?? '', doc);
    return { ok: true, entry };
  } catch (error) {
    console.error('Failed to create application entry', error);
    return { ok: false, reason: 'CAPTURE_FAILED' as const };
  }
}

/**
 * Sends an autofill command to the active tab's content script.
 */
async function handleRunAutofill(applicationEntryId: string) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, reason: 'NO_ACTIVE_TAB' as const };
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'RUN_AUTOFILL',
      applicationEntryId
    });
    return response;
  } catch (error) {
    console.error('Failed to run autofill', error);
    return { ok: false, reason: 'CONTENT_SCRIPT_ERROR' as const };
  }
}
