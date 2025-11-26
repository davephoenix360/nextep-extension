// src/background.ts

/**
 * Nextep Apply background service worker (Manifest V3).
 * For now, this just logs when the extension is installed/updated.
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Nextep] Extension installed/updated:", details.reason);
});
