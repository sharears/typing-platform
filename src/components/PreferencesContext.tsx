"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type FontSize = "small" | "medium" | "large";
export type WindowWidth = "narrow" | "standard" | "wide";
export type WindowColor = "glass" | "dark" | "light";
export type FontFamily = "sans" | "serif" | "mono" | "arial" | "verdana" | "georgia" | "times" | "courier" | "comic";

export interface Preferences {
  fontSize: FontSize;
  windowWidth: WindowWidth;
  windowColor: WindowColor;
  fontFamily: FontFamily;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const defaultPreferences: Preferences = {
  fontSize: "medium",
  windowWidth: "standard",
  windowColor: "glass",
  fontFamily: "sans",
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("type_n_learn_preferences");
    if (saved) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("type_n_learn_preferences", JSON.stringify(updated));
      return updated;
    });
  };

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
