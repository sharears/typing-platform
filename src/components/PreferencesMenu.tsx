"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { usePreferences, FontSize, WindowWidth, WindowColor, FontFamily } from "./PreferencesContext";

export function PreferencesMenu() {
  const { data: session } = useSession();
  const { preferences, updatePreference } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) return null;

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
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Typing Preferences</h3>
          
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
