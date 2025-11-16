
interface CreateApplicationMessage {
  type: "CREATE_APPLICATION_FROM_ACTIVE_TAB";
}

interface RunAutofillMessage {
  type: "RUN_AUTOFILL_IN_ACTIVE_TAB";
  applicationEntryId: string;
}

type BackgroundMessage = CreateApplicationMessage | RunAutofillMessage;

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse) => {
    if (message.type === "CREATE_APPLICATION_FROM_ACTIVE_TAB") {
      handleCreateApplicationFromActiveTab().then(sendResponse);
      return true; // keep the message channel open (async)
    }

    if (message.type === "RUN_AUTOFILL_IN_ACTIVE_TAB") {
      handleRunAutofillInActiveTab(message.applicationEntryId).then(
        sendResponse
      );
      return true;
    }
  }
);

/**
 * Asks the active tab's content script to create an ApplicationEntry from the page DOM.
 */
async function handleCreateApplicationFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, reason: "NO_ACTIVE_TAB" as const };
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "CREATE_APPLICATION_FROM_PAGE",
    });
    return response;
  } catch (error) {
    console.error("Failed to create application from page", error);
    return { ok: false, reason: "CONTENT_SCRIPT_ERROR" as const };
  }
}

/**
 * Instructs the active tab to run autofill using a specific ApplicationEntry.
 */
async function handleRunAutofillInActiveTab(applicationEntryId: string) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { ok: false, reason: "NO_ACTIVE_TAB" as const };
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "RUN_AUTOFILL",
      applicationEntryId,
    });
    return response;
  } catch (error) {
    console.error("Failed to run autofill", error);
    return { ok: false, reason: "CONTENT_SCRIPT_ERROR" as const };
  }
}
