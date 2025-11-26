// src/storage/profileStorage.ts

import type { UserProfile } from "../types/profile";

const USER_PROFILE_KEY = "userProfile";

/**
 * Reads the stored user profile from chrome.storage.local.
 *
 * @returns The stored UserProfile or null if not yet set.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([USER_PROFILE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const raw = result[USER_PROFILE_KEY] as UserProfile | undefined;
      if (!raw) {
        resolve(null);
        return;
      }

      // Basic runtime validation / normalization
      const profile: UserProfile = {
        firstName: raw.firstName ?? "",
        lastName: raw.lastName ?? "",
        email: raw.email ?? "",
        phone: raw.phone ?? "",
        linkedinUrl: raw.linkedinUrl ?? "",
        githubUrl: raw.githubUrl ?? "",
      };

      resolve(profile);
    });
  });
}

/**
 * Saves the provided user profile to chrome.storage.local.
 *
 * @param profile - The UserProfile object to persist.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(
      {
        [USER_PROFILE_KEY]: profile,
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      }
    );
  });
}
