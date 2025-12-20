/**
 * A captured job posting / application entry stored locally in the extension.
 */
export interface ApplicationEntry {
  id: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
  postingUrl: string;
  createdAt: string; // ISO string
}
