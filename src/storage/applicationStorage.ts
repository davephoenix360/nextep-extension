import type { ApplicationEntry } from "../types/application";

const APPLICATION_ENTRIES_KEY = "applicationEntries";

/**
 * Returns all stored application entries (newest first).
 */
export async function getApplicationEntries(): Promise<ApplicationEntry[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([APPLICATION_ENTRIES_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const raw = result[APPLICATION_ENTRIES_KEY];
      const entries = Array.isArray(raw) ? (raw as ApplicationEntry[]) : [];
      // Newest first
      entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      resolve(entries);
    });
  });
}

/**
 * Saves the full list of entries to storage.
 */
export async function saveApplicationEntries(entries: ApplicationEntry[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [APPLICATION_ENTRIES_KEY]: entries }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/**
 * Inserts a new entry at the beginning (newest first).
 */
export async function addApplicationEntry(entry: ApplicationEntry): Promise<void> {
  const entries = await getApplicationEntries();
  entries.unshift(entry);
  await saveApplicationEntries(entries);
}

/**
 * Clears all application entries.
 */
export async function clearApplicationEntries(): Promise<void> {
  await saveApplicationEntries([]);
}
