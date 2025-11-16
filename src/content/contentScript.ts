import { autofillForm } from "../logic/autofillEngine";
import { findFormFields } from "../logic/fieldDetection";
import { extractJobPostingFromDom } from "../logic/jobPostingExtractor";
import { getApplicationEntryById, getUserProfile } from "../storage/storage";
import { createApplicationEntryFromPage } from "../logic/applicationEntries";

interface RunAutofillMessage {
  type: "RUN_AUTOFILL";
  applicationEntryId: string;
}

interface InspectFormMessage {
  type: "INSPECT_FORM";
}

interface CaptureJobPostingMessage {
  type: "CAPTURE_JOB_POSTING";
}

/**
 * Message sent from the background service worker to ask
 * the content script to create and store an ApplicationEntry
 * using the current page's DOM.
 */
interface CreateApplicationFromPageMessage {
  type: "CREATE_APPLICATION_FROM_PAGE";
}

type ContentMessage =
  | RunAutofillMessage
  | InspectFormMessage
  | CaptureJobPostingMessage
  | CreateApplicationFromPageMessage;

console.log("Nextep content script loaded on", window.location.href);

/**
 * Identifies potential resume upload inputs so future automation can target them.
 */
function detectResumeUploadInputs(document: Document): HTMLInputElement[] {
  const candidates = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="file"]')
  );
  return candidates.filter((input) => !input.disabled);
}

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, sender, sendResponse) => {
    if (message.type === "RUN_AUTOFILL") {
      void handleRunAutofill(message.applicationEntryId).then(sendResponse);
      return true;
    }

    if (message.type === "INSPECT_FORM") {
      const fields = findFormFields(document).map((field) => ({
        field: field.field,
        score: field.score,
      }));
      const fileInputs = detectResumeUploadInputs(document).map(
        (input) => input.name || input.id || "file-input"
      );
      sendResponse({ fields, fileInputs });
      return false;
    }

    if (message.type === "CAPTURE_JOB_POSTING") {
      const partial = extractJobPostingFromDom(document);
      sendResponse({ ok: true, partial });
      return false;
    }

    if (message.type === "CREATE_APPLICATION_FROM_PAGE") {
      handleCreateApplicationFromPage(sendResponse);
      return true;
    }

    return undefined;
  }
);

/**
 * Loads the necessary data and executes autofill for the active document.
 */
async function handleRunAutofill(applicationEntryId: string) {
  const [profile, entry] = await Promise.all([
    getUserProfile(),
    getApplicationEntryById(applicationEntryId),
  ]);
  if (!profile) {
    return { ok: false, reason: "NO_PROFILE" as const };
  }
  if (!entry) {
    return { ok: false, reason: "ENTRY_NOT_FOUND" as const };
  }

  const result = autofillForm(document, profile);
  const resumeInputs = detectResumeUploadInputs(document).length;

  return {
    ok: true,
    filledFields: result.filledFields,
    skippedFields: result.skippedFields,
    resumeUploadInputsDetected: resumeInputs,
  };
}

/**
 * Creates a new ApplicationEntry using the live DOM of the current page
 * and stores it via the applicationEntries logic.
 */
function handleCreateApplicationFromPage(
  sendResponse: (response: any) => void
): void {
  (async () => {
    try {
      const url = window.location.href;
      const entry = await createApplicationEntryFromPage(url, document);

      sendResponse({
        ok: true,
        entry,
      });
    } catch (error) {
      console.error(
        "Nextep: error creating application entry from page",
        error
      );
      sendResponse({
        ok: false,
        error: String(error),
      });
    }
  })();
}

export {}; // ensure this file is treated as a module
