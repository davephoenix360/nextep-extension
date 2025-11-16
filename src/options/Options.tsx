import React, { FormEvent, useEffect, useState } from 'react';
import {
  clearAllData,
  getApplicationEntries,
  getGeneralResumeText,
  getUserProfile,
  saveGeneralResumeText,
  saveUserProfile
} from '../storage/storage';
import { UserProfile } from '../storage/types';

const defaultProfile: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  linkedinUrl: '',
  githubUrl: '',
  websiteUrl: '',
  targetJobTitles: []
};

/**
 * Serializes stored target titles back into a comma-separated list.
 */
function formatTargetTitles(titles: string[]): string {
  return titles.join(', ');
}

/**
 * Converts stored profile data (including legacy fullName fields) into the latest shape.
 */
function normalizeProfile(stored?: UserProfile | (Partial<UserProfile> & { fullName?: string })): UserProfile {
  if (!stored) {
    return { ...defaultProfile };
  }
  const fallbackFullName = 'fullName' in stored ? stored.fullName : '';
  const [legacyFirst, ...legacyRest] = (fallbackFullName ?? '').split(' ').filter(Boolean);
  return {
    ...defaultProfile,
    ...stored,
    firstName: stored.firstName ?? legacyFirst ?? '',
    lastName: stored.lastName ?? legacyRest.join(' ') ?? ''
  };
}

const Options: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [targetTitlesInput, setTargetTitlesInput] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [entryCount, setEntryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const [storedProfile, storedResume, entries] = await Promise.all([
        getUserProfile(),
        getGeneralResumeText(),
        getApplicationEntries()
      ]);
      if (storedProfile) {
        const normalized = normalizeProfile(storedProfile);
        setProfile(normalized);
        setTargetTitlesInput(formatTargetTitles(normalized.targetJobTitles));
      }
      if (storedResume) {
        setResumeText(storedResume);
      }
      setEntryCount(entries.length);
    }
    void loadData();
  }, []);

  /**
   * Persists profile edits including parsed target job titles.
   */
  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const nextProfile: UserProfile = {
      ...profile,
      targetJobTitles: targetTitlesInput
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    };
    await saveUserProfile(nextProfile);
    setProfile(nextProfile);
    setStatusMessage('Profile updated.');
  };

  /**
   * Updates the stored resume text from the uploaded file contents.
   */
  const handleResumeUpload = async (file: File) => {
    const text = await file.text();
    setResumeText(text);
    await saveGeneralResumeText(text);
    setStatusMessage(`Resume text updated from ${file.name}.`);
  };

  /**
   * Clears all saved profile, resume, and application data.
   */
  const handleClearData = async () => {
    await clearAllData();
    setProfile(defaultProfile);
    setTargetTitlesInput('');
    setResumeText('');
    setEntryCount(0);
    setStatusMessage('All extension data cleared.');
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <h1>Nextep Apply Options</h1>
      <p>Manage your saved profile, resume, and stored application entries.</p>

      <section style={{ marginTop: '24px' }}>
        <h2>User Profile</h2>
        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '12px', maxWidth: 520 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <label>
              First Name
              <input value={profile.firstName} onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))} />
            </label>
            <label>
              Last Name
              <input value={profile.lastName} onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))} />
            </label>
          </div>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            Phone
            <input value={profile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Address
            <input value={profile.address ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))} />
          </label>
          <label>
            City
            <input value={profile.city ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))} />
          </label>
          <label>
            Postal Code
            <input
              value={profile.postalCode ?? ''}
              onChange={(event) => setProfile((prev) => ({ ...prev, postalCode: event.target.value }))}
            />
          </label>
          <label>
            LinkedIn URL
            <input
              value={profile.linkedinUrl ?? ''}
              onChange={(event) => setProfile((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
            />
          </label>
          <label>
            GitHub URL
            <input
              value={profile.githubUrl ?? ''}
              onChange={(event) => setProfile((prev) => ({ ...prev, githubUrl: event.target.value }))}
            />
          </label>
          <label>
            Portfolio / Website
            <input
              value={profile.websiteUrl ?? ''}
              onChange={(event) => setProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))}
            />
          </label>
          <label>
            Target Job Titles
            <input value={targetTitlesInput} onChange={(event) => setTargetTitlesInput(event.target.value)} />
          </label>
          <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none' }}>
            Save Profile
          </button>
        </form>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2>General Resume</h2>
        <p>Stored characters: {resumeText.length}</p>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.tex"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleResumeUpload(file);
            }
          }}
        />
        <textarea
          value={resumeText}
          onChange={(event) => {
            setResumeText(event.target.value);
            void saveGeneralResumeText(event.target.value);
          }}
          rows={8}
          style={{ width: '100%', marginTop: '12px' }}
        />
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2>Data Management</h2>
        <p>Application entries stored: {entryCount}</p>
        <button
          type="button"
          onClick={handleClearData}
          style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none' }}
        >
          Clear All Data
        </button>
      </section>

      {statusMessage && <p style={{ marginTop: '24px', color: '#2563eb' }}>{statusMessage}</p>}
    </main>
  );
};

export default Options;
