import { useEffect, useState } from "react";
import "./App.css";
import type { UserProfile } from "./types/profile";
import { getUserProfile, saveUserProfile } from "./storage/profileStorage";

const EMPTY_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  githubUrl: "",
};

function App() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("Loading profile...");

  // Load profile on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getUserProfile();
        if (stored) {
          setProfile(stored);
          setStatus("Profile loaded.");
        } else {
          setStatus("No profile yet. Please fill in your details.");
        }
      } catch (error) {
        console.error("[Nextep] Failed to load profile:", error);
        setStatus("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField =
    (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSave = async () => {
    setStatus("Saving profile...");
    try {
      await saveUserProfile(profile);
      setStatus("Profile saved ✅");
    } catch (error) {
      console.error("[Nextep] Failed to save profile:", error);
      setStatus("Failed to save profile.");
    }
  };

  return (
    <div
      className="App"
      style={{
        padding: "1rem",
        width: 360,
        fontSize: "0.9rem",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
        Nextep Apply
      </h1>
      <p style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.8rem" }}>
        Phase 3: Basic profile onboarding stored in chrome.storage.
      </p>

      <div
        style={{
          fontSize: "0.8rem",
          marginBottom: "0.75rem",
          color: "#64748b",
        }}
      >
        <strong>Status:</strong> {status}
      </div>

      {loading ? (
        <div style={{ fontSize: "0.85rem" }}>Loading...</div>
      ) : (
        <>
          <div
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: 2,
                }}
              >
                First name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={updateField("firstName")}
                style={{
                  width: "100%",
                  padding: "0.25rem 0.4rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: 2,
                }}
              >
                Last name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={updateField("lastName")}
                style={{
                  width: "100%",
                  padding: "0.25rem 0.4rem",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label
              style={{ display: "block", fontSize: "0.75rem", marginBottom: 2 }}
            >
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={updateField("email")}
              style={{
                width: "100%",
                padding: "0.25rem 0.4rem",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label
              style={{ display: "block", fontSize: "0.75rem", marginBottom: 2 }}
            >
              Phone (optional)
            </label>
            <input
              type="tel"
              value={profile.phone ?? ""}
              onChange={updateField("phone")}
              style={{
                width: "100%",
                padding: "0.25rem 0.4rem",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label
              style={{ display: "block", fontSize: "0.75rem", marginBottom: 2 }}
            >
              LinkedIn URL (optional)
            </label>
            <input
              type="url"
              value={profile.linkedinUrl ?? ""}
              onChange={updateField("linkedinUrl")}
              style={{
                width: "100%",
                padding: "0.25rem 0.4rem",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{ display: "block", fontSize: "0.75rem", marginBottom: 2 }}
            >
              GitHub URL (optional)
            </label>
            <input
              type="url"
              value={profile.githubUrl ?? ""}
              onChange={updateField("githubUrl")}
              style={{
                width: "100%",
                padding: "0.25rem 0.4rem",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.85rem",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#16a34a",
              color: "white",
            }}
          >
            Save profile
          </button>
        </>
      )}
    </div>
  );
}

export default App;
