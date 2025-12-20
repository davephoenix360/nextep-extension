import { useState } from "react";
import "./App.css";
import type { ApplicationEntry } from "./types/application";
import {
  getApplicationEntries,
  clearApplicationEntries,
} from "./storage/applicationStorage";

function App() {
  const [status, setStatus] = useState("Ready.");
  const [entries, setEntries] = useState<ApplicationEntry[]>([]);

  const refreshEntries = async () => {
    const list = await getApplicationEntries();
    setEntries(list);
  };

  if (entries.length === 0) {
    // Initial load
    refreshEntries();
  }

  const captureFromActiveTab = async () => {
    setStatus("Capturing job posting from active tab...");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        setStatus("No active tab found.");
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { type: "CAPTURE_JOB_POSTING" },
        async (response) => {
          if (chrome.runtime.lastError) {
            setStatus(`Failed: ${chrome.runtime.lastError.message}`);
            return;
          }

          if (!response?.ok) {
            setStatus(`Capture failed: ${response?.reason ?? "UNKNOWN"}`);
            return;
          }

          setStatus("Captured ✅");
          await refreshEntries();
        }
      );
    });
  };

  const handleClear = async () => {
    await clearApplicationEntries();
    await refreshEntries();
    setStatus("Cleared all entries.");
  };

  return (
    <div style={{ padding: "1rem", width: 360 }}>
      <h1 style={{ margin: 0, fontSize: "1.1rem" }}>Nextep Apply</h1>
      <div
        style={{
          fontSize: "0.8rem",
          color: "#64748b",
          marginTop: 6,
          marginBottom: 12,
        }}
      >
        <strong>Status:</strong> {status}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={captureFromActiveTab}
          style={{
            flex: 1,
            padding: "0.45rem",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Capture job posting
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: "0.45rem",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            cursor: "pointer",
            background: "white",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ fontSize: "0.85rem", marginBottom: 6 }}>
        Saved entries ({entries.length})
      </div>

      <div
        style={{
          maxHeight: 220,
          overflow: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        {entries.length === 0 ? (
          <div style={{ padding: 10, fontSize: "0.8rem", color: "#64748b" }}>
            No entries yet. Open a job posting page and click “Capture job
            posting”.
          </div>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                {e.jobTitle}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                {e.company ? `${e.company} • ` : ""}
                {new Date(e.createdAt).toLocaleString()}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}
              >
                <a href={e.postingUrl} target="_blank" rel="noreferrer">
                  Open posting
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
