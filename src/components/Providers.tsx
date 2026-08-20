"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

import { PreferencesProvider } from "./PreferencesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PreferencesProvider>{children}</PreferencesProvider>
    </SessionProvider>
  );
}
