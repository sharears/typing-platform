"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { usePreferences, FontSize, WindowWidth, WindowColor, FontFamily } from "./PreferencesContext";

export function PreferencesMenu() {
  const { data: session } = useSession();
  const { preferences, updatePreference } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: session?.user?.name || "", email: session?.user?.email || "", password: "" });
  const [profileStatus, setProfileStatus] = useState("");

  if (!session?.user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus("Updating...");
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        setProfileStatus("Updated successfully! Changes apply on next login.");
        setTimeout(() => setIsEditingProfile(false), 2000);
      } else {
        setProfileStatus("Failed to update profile.");
      }
    } catch (err) {
      setProfileStatus("An error occurred.");
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 100 }}>
      {isOpen && (
        <div 
          className="glass-panel" 
          style={{ 
            position: "absolute", 
            bottom: "100%", 
            left: "0", 
            marginBottom: "10px", 
            width: "300px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}
        >
          {isEditingProfile ? (
            <>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>Username</label>
                  <input type="text" className="input-field" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>Email</label>
                  <input type="email" className="input-field" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>New Password (Optional)</label>
                  <input type="password" className="input-field" value={profileForm.password} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: "10px" }}>Save Changes</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="btn-secondary">Cancel</button>
                {profileStatus && <div style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{profileStatus}</div>}
              </form>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Typing Preferences</h3>
                <button onClick={() => setIsEditingProfile(true)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.85rem" }}>Edit Profile</button>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "var(--untyped)" }}>
                  Window Size (Width)
                </label>
                <select 
                  className="input-field"
                  value={preferences.windowWidth}
                  onChange={(e) => updatePreference("windowWidth", e.target.value as WindowWidth)}
                >
                  <option value="narrow">Narrow</option>
                  <option value="standard">Standard</option>
                  <option value="wide">Wide</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "var(--untyped)" }}>
                  Window Color
                </label>
                <select 
                  className="input-field"
                  value={preferences.windowColor}
                  onChange={(e) => updatePreference("windowColor", e.target.value as WindowColor)}
                >
                  <option value="glass">Glass (Default)</option>
                  <option value="dark">Solid Dark</option>
                  <option value="light">Solid Light</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "var(--untyped)" }}>
                  Font Size
                </label>
                <select 
                  className="input-field"
                  value={preferences.fontSize}
                  onChange={(e) => updatePreference("fontSize", e.target.value as FontSize)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "var(--untyped)" }}>
                  Font Style
                </label>
                <select 
                  className="input-field"
                  value={preferences.fontFamily}
                  onChange={(e) => updatePreference("fontFamily", e.target.value as FontFamily)}
                >
                  <option value="sans">Sans-Serif (Modern)</option>
                  <option value="serif">Serif (Classic)</option>
                  <option value="mono">Monospace (Code)</option>
                  <option value="arial">Arial</option>
                  <option value="verdana">Verdana</option>
                  <option value="georgia">Georgia</option>
                  <option value="times">Times New Roman</option>
                  <option value="courier">Courier New</option>
                  <option value="comic">Comic Sans MS</option>
                </select>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="btn-secondary" style={{ marginTop: "10px" }}>
                Close
              </button>
            </>
          )}
        </div>
      )}

      <div 
        className="glass-panel" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px", 
          padding: "10px 15px", 
          cursor: "pointer",
          userSelect: "none"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          style={{ 
            width: "30px", 
            height: "30px", 
            borderRadius: "50%", 
            backgroundColor: "var(--primary)", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            fontWeight: "bold",
            color: "white"
          }}
        >
          {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{session.user.name}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--untyped)" }}>Preferences</div>
        </div>
      </div>
    </div>
  );
}
