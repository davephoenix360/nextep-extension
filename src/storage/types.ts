export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  targetJobTitles: string[];
  summary?: string;
}

export interface ApplicationEntry {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobDescription: string;
  postingUrl?: string;
  createdAt: string;
  tailoredResumeMetadataId?: string;
}

export interface StoredState {
  userProfile?: UserProfile;
  applicationEntries: ApplicationEntry[];
  generalResumeText?: string;
}

/**
 * Builds a human-readable full name from the stored first and last name fields.
 */
export function composeFullName(profile: Pick<UserProfile, 'firstName' | 'lastName'>): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
}
