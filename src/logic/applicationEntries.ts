import { extractJobPostingFromDom } from './jobPostingExtractor';
import {
  getApplicationEntries,
  getApplicationEntryById,
  saveApplicationEntries,
  upsertApplicationEntry,
  deleteApplicationEntry as deleteEntryFromStorage
} from '../storage/storage';
import { ApplicationEntry } from '../storage/types';

/**
 * Generates a stable identifier for a newly captured application entry.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Captures a job posting from the provided DOM snapshot and saves a new entry.
 */
export async function createApplicationEntryFromPage(url: string, doc: Document): Promise<ApplicationEntry> {
  const partial = extractJobPostingFromDom(doc);
  const entry: ApplicationEntry = {
    id: generateId(),
    jobTitle: partial.jobTitle ?? 'Untitled Role',
    company: partial.company ?? 'Unknown Company',
    location: partial.location,
    jobDescription: partial.jobDescription ?? '',
    postingUrl: partial.postingUrl ?? url,
    createdAt: new Date().toISOString()
  };
  await upsertApplicationEntry(entry);
  return entry;
}

/**
 * Returns application entries sorted by recency for display purposes.
 */
export async function listApplicationEntries(): Promise<ApplicationEntry[]> {
  const entries = await getApplicationEntries();
  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Applies partial updates to an existing entry.
 */
export async function updateApplicationEntry(
  id: string,
  updates: Partial<ApplicationEntry>
): Promise<ApplicationEntry | undefined> {
  const existing = await getApplicationEntryById(id);
  if (!existing) {
    return undefined;
  }
  const updated: ApplicationEntry = { ...existing, ...updates };
  await upsertApplicationEntry(updated);
  return updated;
}

/**
 * Removes a stored entry permanently.
 */
export async function deleteApplicationEntry(id: string): Promise<void> {
  await deleteEntryFromStorage(id);
}

/**
 * Replaces the full collection of entries with the provided list.
 */
export async function replaceApplicationEntries(entries: ApplicationEntry[]): Promise<void> {
  await saveApplicationEntries(entries);
}
