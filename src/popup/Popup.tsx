import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  getGeneralResumeText,
  getUserProfile,
  saveGeneralResumeText,
  saveUserProfile
} from '../storage/storage';
import { ApplicationEntry, UserProfile } from '../storage/types';
import {
  deleteApplicationEntry,
  listApplicationEntries,
  updateApplicationEntry
} from '../logic/applicationEntries';
import {
  compileLatexToPdf,
  generateTailoredResumeLatex,
  TailoredResumeMetadata
} from '../logic/resumeEngineStub';

const emptyProfile: UserProfile = {
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
 * Splits a comma-delimited list of target titles into normalized values.
 */
function parseTargetTitles(input: string): string[] {
  return input
    .split(',')
    .map((title) => title.trim())
    .filter(Boolean);
}

/**
 * Ensures stored user profile data includes first/last names, deriving from legacy fullName when needed.
 */
function normalizeProfile(stored?: UserProfile | (Partial<UserProfile> & { fullName?: string })): UserProfile {
  if (!stored) {
    return { ...emptyProfile };
  }
  const fallbackFullName = 'fullName' in stored ? stored.fullName : '';
  const [legacyFirst, ...legacyRest] = (fallbackFullName ?? '').split(' ').filter(Boolean);
  const normalized: UserProfile = {
    ...emptyProfile,
    ...stored,
    firstName: stored.firstName ?? legacyFirst ?? '',
    lastName: stored.lastName ?? legacyRest.join(' ') ?? ''
  };
  return normalized;
}

const Popup: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [targetTitlesInput, setTargetTitlesInput] = useState('');
  const [generalResume, setGeneralResume] = useState('');
  const [entries, setEntries] = useState<ApplicationEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedResumeMetadata, setGeneratedResumeMetadata] = useState<TailoredResumeMetadata | null>(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );

  useEffect(() => {
    async function loadInitialData() {
      const [storedProfile, storedResumeText, storedEntries] = await Promise.all([
        getUserProfile(),
        getGeneralResumeText(),
        listApplicationEntries()
      ]);
      if (storedProfile) {
        const normalized = normalizeProfile(storedProfile);
        setProfile(normalized);
        setTargetTitlesInput(normalized.targetJobTitles.join(', '));
      }
      if (storedResumeText) {
        setGeneralResume(storedResumeText);
      }
      setEntries(storedEntries);
      if (storedEntries.length > 0) {
        setSelectedEntryId(storedEntries[0].id);
      }
      setIsLoading(false);
    }
    void loadInitialData();
  }, []);

  const isOnboarding = !profile.firstName || !profile.lastName || profile.targetJobTitles.length === 0;

  /**
   * Persists the onboarding profile information and parsed target roles.
   */
  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const updatedProfile: UserProfile = {
      ...profile,
      targetJobTitles: parseTargetTitles(targetTitlesInput)
    };
    await saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setStatusMessage('Profile saved successfully.');
  };

  /**
   * Reads the uploaded resume file and stores its text representation.
   */
  const handleResumeUpload = async (file: File) => {
    const text = await file.text();
    setGeneralResume(text);
    await saveGeneralResumeText(text);
    setStatusMessage(`Imported resume text from ${file.name}.`);
  };

  /**
   * Requests the background script to capture job data from the active tab.
   */
  const handleCreateApplication = async () => {
    setStatusMessage('Capturing job posting...');
    const response = await chrome.runtime.sendMessage({ type: 'CREATE_APPLICATION_FROM_ACTIVE_TAB' });
    if (response?.ok) {
      const updatedEntries = await listApplicationEntries();
      setEntries(updatedEntries);
      setSelectedEntryId(response.entry.id);
      setStatusMessage('Application entry created from current page.');
    } else {
      setStatusMessage('Unable to capture job posting. Open a job page and try again.');
    }
  };

  /**
   * Applies inline edits to the selected application entry field.
   */
  const handleEntryChange = async (field: keyof ApplicationEntry, value: string) => {
    if (!selectedEntry) return;
    const updated = await updateApplicationEntry(selectedEntry.id, { [field]: value });
    if (!updated) return;
    setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
  };

  /**
   * Removes the specified entry and refreshes the local list.
   */
  const handleDeleteEntry = async (id: string) => {
    await deleteApplicationEntry(id);
    const updatedEntries = await listApplicationEntries();
    setEntries(updatedEntries);
    if (selectedEntryId === id) {
      setSelectedEntryId(updatedEntries[0]?.id ?? null);
    }
    setStatusMessage('Deleted application entry.');
  };

  /**
   * Invokes the resume stub to simulate tailored resume creation.
   */
  const handleGenerateTailoredResume = async () => {
    if (!selectedEntry) return;
    const latex = await generateTailoredResumeLatex(profile, generalResume, selectedEntry);
    const metadata = await compileLatexToPdf(latex, selectedEntry.id);
    setGeneratedResumeMetadata(metadata);
    setStatusMessage('Generated placeholder tailored resume metadata.');
  };

  /**
   * Sends an autofill command to the active tab for the selected entry.
   */
  const handleRunAutofill = async () => {
    if (!selectedEntry) return;
    const response = await chrome.runtime.sendMessage({
      type: 'RUN_AUTOFILL_IN_ACTIVE_TAB',
      applicationEntryId: selectedEntry.id
    });
    if (response?.ok) {
      setStatusMessage(
        `Autofill complete. Filled ${response.filledFields.length} fields, skipped ${response.skippedFields.length}.`
      );
    } else {
      setStatusMessage('Autofill could not run. Ensure the application form is open.');
    }
  };

  const renderOnboarding = () => (
    <form className="section-card" onSubmit={handleProfileSubmit}>
      <h2>Welcome to Nextep Apply</h2>
      <p className="empty-state">Let’s capture your profile to streamline future applications.</p>
      <div className="input-grid">
        <div className="input-group">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            value={profile.firstName}
            onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            value={profile.lastName}
            onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
            required
          />
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={profile.email}
          onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
      </div>
      <div className="input-group">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          value={profile.phone}
          onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
      </div>
      <div className="input-group">
        <label htmlFor="targetTitles">Target Job Titles</label>
        <input
          id="targetTitles"
          placeholder="e.g. Frontend Engineer, Product Manager"
          value={targetTitlesInput}
          onChange={(event) => setTargetTitlesInput(event.target.value)}
          required
        />
      </div>
      <div className="input-group">
        <label htmlFor="resumeUpload">Upload General Resume</label>
        <input
          id="resumeUpload"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.tex"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleResumeUpload(file);
            }
          }}
        />
      </div>
      <button className="button-primary" type="submit">
        Save Profile
      </button>
    </form>
  );

  const renderEntryDetails = () => {
    if (!selectedEntry) {
      return <p className="empty-state">Select an application to view details.</p>;
    }
    return (
      <div className="section-card">
        <h2>{selectedEntry.jobTitle}</h2>
        <div className="input-group">
          <label htmlFor="entryJobTitle">Job Title</label>
          <input
            id="entryJobTitle"
            value={selectedEntry.jobTitle}
            onChange={(event) => void handleEntryChange('jobTitle', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="entryCompany">Company</label>
          <input
            id="entryCompany"
            value={selectedEntry.company}
            onChange={(event) => void handleEntryChange('company', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="entryLocation">Location</label>
          <input
            id="entryLocation"
            value={selectedEntry.location ?? ''}
            onChange={(event) => void handleEntryChange('location', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="entryDescription">Job Description</label>
          <textarea
            id="entryDescription"
            rows={4}
            value={selectedEntry.jobDescription}
            onChange={(event) => void handleEntryChange('jobDescription', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="entryUrl">Posting URL</label>
          <input
            id="entryUrl"
            value={selectedEntry.postingUrl ?? ''}
            onChange={(event) => void handleEntryChange('postingUrl', event.target.value)}
          />
        </div>
        <p className="empty-state">Created {new Date(selectedEntry.createdAt).toLocaleString()}</p>
        <div className="button-row">
          <button className="button-primary" onClick={handleGenerateTailoredResume} type="button">
            Generate Tailored Resume
          </button>
          <button className="button-secondary" onClick={handleRunAutofill} type="button">
            Auto-fill This Application
          </button>
          <button className="button-secondary" onClick={() => void handleDeleteEntry(selectedEntry.id)} type="button">
            Delete Entry
          </button>
        </div>
        {generatedResumeMetadata && generatedResumeMetadata.applicationEntryId === selectedEntry.id && (
          <p className="empty-state">
            Placeholder resume generated at {new Date(generatedResumeMetadata.generatedAt).toLocaleString()}.
          </p>
        )}
      </div>
    );
  };

  const renderApplicationList = () => (
    <div className="section-card">
      <div className="button-row">
        <button className="button-primary" type="button" onClick={handleCreateApplication}>
          Create Application From Current Page
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="empty-state">No applications captured yet.</p>
      ) : (
        <div className="application-list">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`application-item ${selectedEntryId === entry.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedEntryId(entry.id);
                setGeneratedResumeMetadata(null);
              }}
            >
              <strong>{entry.jobTitle}</strong>
              <div>{entry.company}</div>
              <div className="empty-state">{new Date(entry.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Nextep Apply – Job Application Assistant</h1>
        <p>Accelerate every application with guided capture and autofill.</p>
      </header>
      {isLoading ? (
        <p>Loading...</p>
      ) : isOnboarding ? (
        renderOnboarding()
      ) : (
        <>
          {renderApplicationList()}
          {renderEntryDetails()}
        </>
      )}
      {statusMessage && <p className="empty-state">{statusMessage}</p>}
    </div>
  );
};

export default Popup;
