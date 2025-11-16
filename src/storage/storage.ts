import { ApplicationEntry, UserProfile } from './types';

const STORAGE_KEYS = {
  userProfile: 'userProfile',
  applicationEntries: 'applicationEntries',
  generalResumeText: 'generalResumeText'
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

type StorageValueMap = {
  userProfile: UserProfile | undefined;
  applicationEntries: ApplicationEntry[] | undefined;
  generalResumeText: string | undefined;
};

/**
 * Reads a strongly-typed value from chrome.storage.local using the given logical key.
 */
async function readFromStorage<K extends StorageKey>(key: K): Promise<StorageValueMap[K]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS[key]);
  return result[STORAGE_KEYS[key]] as StorageValueMap[K];
}

/**
 * Persists a strongly-typed value into chrome.storage.local using the given logical key.
 */
async function writeToStorage<K extends StorageKey>(key: K, value: StorageValueMap[K]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS[key]]: value });
}

/**
 * Loads the stored user profile, if one exists.
 */
export async function getUserProfile(): Promise<UserProfile | undefined> {
  return (await readFromStorage('userProfile')) ?? undefined;
}

/**
 * Persists the latest user profile snapshot.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await writeToStorage('userProfile', profile);
}

/**
 * Loads the plain-text general resume content stored locally.
 */
export async function getGeneralResumeText(): Promise<string | undefined> {
  return (await readFromStorage('generalResumeText')) ?? undefined;
}

/**
 * Persists the supplied plain-text resume representation for later tailoring.
 */
export async function saveGeneralResumeText(resumeText: string | undefined): Promise<void> {
  await writeToStorage('generalResumeText', resumeText);
}

/**
 * Retrieves every saved application entry sorted as stored.
 */
export async function getApplicationEntries(): Promise<ApplicationEntry[]> {
  const entries = (await readFromStorage('applicationEntries')) ?? [];
  return entries;
}

/**
 * Saves the provided list of application entries.
 */
export async function saveApplicationEntries(entries: ApplicationEntry[]): Promise<void> {
  await writeToStorage('applicationEntries', entries);
}

/**
 * Finds a single application entry by its identifier.
 */
export async function getApplicationEntryById(id: string): Promise<ApplicationEntry | undefined> {
  const entries = await getApplicationEntries();
  return entries.find((entry) => entry.id === id);
}

/**
 * Inserts or updates an application entry, ensuring only one copy is stored.
 */
export async function upsertApplicationEntry(entry: ApplicationEntry): Promise<void> {
  const entries = await getApplicationEntries();
  const existingIndex = entries.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  await saveApplicationEntries(entries);
}

/**
 * Removes the specified application entry.
 */
export async function deleteApplicationEntry(id: string): Promise<void> {
  const entries = await getApplicationEntries();
  const filtered = entries.filter((entry) => entry.id !== id);
  await saveApplicationEntries(filtered);
}

/**
 * Clears all extension-managed data from storage.
 */
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.remove(Object.values(STORAGE_KEYS));
}
