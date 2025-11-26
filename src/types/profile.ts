// src/types/profile.ts

/**
 * UserProfile represents the basic personal information Nextep Apply
 * needs in order to auto-fill job applications.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;

  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;

  // Add more fields over time (location, portfolio, etc.)
}

/**
 * Returns a full name string based on the profile.
 */
export function getUserFullName(profile: UserProfile): string {
  const first = profile.firstName?.trim() ?? "";
  const last = profile.lastName?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ");
}
