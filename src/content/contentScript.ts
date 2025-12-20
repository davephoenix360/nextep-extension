import { extractJobPostingFromDom } from "../logic/jobPostingExtractor";
import { addApplicationEntry } from "../storage/applicationStorage";
import type { ApplicationEntry } from "../types/application";

console.log("[Nextep] TS content script loaded:", window.location.href);

type IncomingMessage =
  | { type: "CAPTURE_JOB_POSTING" };

chrome.runtime.onMessage.addListener((message: IncomingMessage, sender, sendResponse) => {
  if (message.type === "CAPTURE_JOB_POSTING") {
    handleCaptureJobPosting(sendResponse);
    return true; // async
  }
  return false;
});

/**
 * Captures the current page as a job posting and stores it as an ApplicationEntry.
 */
function handleCaptureJobPosting(sendResponse: (res: any) => void) {
  (async () => {
    try {
      const { jobTitle, company, jobDescription } = extractJobPostingFromDom(document);

      if (!jobTitle || jobTitle.length < 2) {
        sendResponse({ ok: false, reason: "NO_TITLE_DETECTED" });
        return;
      }

      const entry: ApplicationEntry = {
        id: crypto?.randomUUID ? crypto.randomUUID() : `app_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        jobTitle,
        company: company || undefined,
        jobDescription: jobDescription || "",
        postingUrl: window.location.href,
        createdAt: new Date().toISOString(),
      };

      await addApplicationEntry(entry);

      sendResponse({ ok: true, entry });
    } catch (err) {
      console.error("[Nextep] capture failed:", err);
      sendResponse({ ok: false, reason: "ERROR", error: String(err) });
    }
  })();
}
