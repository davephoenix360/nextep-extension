// public/contentScript.js

console.log("[Nextep] Content script loaded on", window.location.href);

// Listen for messages from popup/background/etc.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING_CONTENT") {
    console.log("[Nextep] Received PING_CONTENT in content script:", message);

    sendResponse({
      ok: true,
      reply: "Hello from content script 👋",
      url: window.location.href,
      receivedAt: new Date().toISOString(),
    });

    // Return true isn't needed here because we respond synchronously,
    // but it's harmless if you later make this handler async.
  }
});
