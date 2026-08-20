"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePreferences } from "./PreferencesContext";

interface TypingInterfaceProps {
  content: string;
  onComplete: (wpm: number, errorRate: number, detailedMistakes: { expected: string; typed: string }[]) => void;
  maskMode?: "none" | "all" | "partial";
}

export function TypingInterface({ content, onComplete, maskMode = "none" }: TypingInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Record<number, boolean>>({});
  const [detailedMistakes, setDetailedMistakes] = useState<{ expected: string; typed: string }[]>([]);
  
  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalActiveTimeMs, setTotalActiveTimeMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [maskedWordIndices, setMaskedWordIndices] = useState<Set<number>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSpanRef = useRef<HTMLSpanElement>(null);
  const { preferences } = usePreferences();

  const charToWordIndex = React.useMemo(() => {
    const mapping: number[] = [];
    let wordIndex = 0;
    for (let i = 0; i < content.length; i++) {
      mapping.push(wordIndex);
      if (content[i] === ' ' || content[i] === '\n') wordIndex++;
    }
    return mapping;
  }, [content]);

  useEffect(() => {
    if (maskMode === "partial") {
      const totalWords = charToWordIndex[charToWordIndex.length - 1] + 1;
      const masked = new Set<number>();
      for (let i = 0; i < totalWords; i++) {
        if (Math.random() > 0.6) masked.add(i);
      }
      setMaskedWordIndices(masked);
    }
  }, [content, maskMode, charToWordIndex]);

  useEffect(() => {
    // Focus the container when mounted so user can start typing immediately
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    // Keep the current typing position centered in the viewport
    if (currentSpanRef.current && !isPaused) {
      currentSpanRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
    }
  }, [currentIndex, isPaused]);

  // Incremental sync logic
  const [maxWordIndexSynced, setMaxWordIndexSynced] = useState(0);

  const syncWords = (currentWordIdx: number) => {
    const wordsToSync = currentWordIdx - maxWordIndexSynced;
    if (wordsToSync > 0) {
      setMaxWordIndexSynced(currentWordIdx);
      fetch('/api/sync-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordsTyped: wordsToSync })
      }).catch(console.error);
    }
  };

  useEffect(() => {
    const currentWordIdx = charToWordIndex[currentIndex] || 0;
    if (currentWordIdx - maxWordIndexSynced >= 10) {
      syncWords(currentWordIdx);
    }
  }, [currentIndex, charToWordIndex, maxWordIndexSynced]);

  // Sync on unmount
  useEffect(() => {
    return () => {
      // Use state references carefully on unmount, better to use a ref for maxWordIndexSynced if we really want perfect unmount syncing.
      // But for now, we also sync when they finish the whole text below.
    };
  }, []);

  const handlePause = () => {
    if (!isPaused && startTime) {
      setTotalActiveTimeMs(prev => prev + (Date.now() - startTime));
      setStartTime(null);
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    // Delay focus slightly to ensure the overlay is unmounted
    setTimeout(() => {
      containerRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    // If paused, listen globally so pressing any key works even if focus was lost
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isPaused) {
        if (e.key === " ") e.preventDefault(); // Prevent spacebar scrolling
        handleResume();
      }
    };

    if (isPaused) {
      window.addEventListener("keydown", handleGlobalKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isPaused) {
      handleResume();
      return; // Do not process this keystroke, just use it to wake up
    }

    // Prevent the browser from scrolling down when spacebar is pressed
    if (e.key === " ") {
      e.preventDefault();
    }

    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta" || e.key === "CapsLock" || e.key === "Escape") {
      if (e.key === "Escape") handlePause();
      return;
    }

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (e.key === "Backspace") {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (currentIndex >= content.length) {
      return;
    }

    const expectedChar = content[currentIndex];
    const typedChar = e.key === "Enter" ? "\n" : e.key;
    const isCorrect = expectedChar === typedChar;

    if (!isCorrect) {
      setMistakes((prev) => ({ ...prev, [currentIndex]: true }));
      setDetailedMistakes((prev) => [...prev, { expected: expectedChar, typed: typedChar }]);
    } else {
      setMistakes((prev) => {
        const next = { ...prev };
        delete next[currentIndex];
        return next;
      });
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex === content.length) {
      // Sync any final remaining words
      const finalWordIdx = charToWordIndex[nextIndex - 1] + 1 || charToWordIndex[nextIndex - 2] + 1 || 0;
      syncWords(finalWordIdx);

      // Calculate final time accounting for pauses
      let finalActiveTimeMs = totalActiveTimeMs;
      if (startTime) {
        finalActiveTimeMs += (Date.now() - startTime);
      }
      
      const timeInMinutes = (finalActiveTimeMs / 60000) || (1 / 60); // fallback if instant
      const words = content.split(" ").length;
      const wpm = Math.round(words / timeInMinutes);
      const errorRate = (Object.keys(mistakes).length / content.length) * 100;
      onComplete(wpm, errorRate, detailedMistakes);
    }
  };

  const progressPercentage = Math.min(100, Math.max(0, (currentIndex / content.length) * 100));

  const getFontSize = () => {
    switch(preferences.fontSize) {
      case "small": return "1rem";
      case "large": return "2rem";
      default: return "1.5rem";
    }
  };

  const getFontFamily = () => {
    switch(preferences.fontFamily) {
      case "sans": return "system-ui, sans-serif";
      case "serif": return "Georgia, serif";
      case "arial": return "Arial, Helvetica, sans-serif";
      case "verdana": return "Verdana, Geneva, sans-serif";
      case "georgia": return "Georgia, serif";
      case "times": return "'Times New Roman', Times, serif";
      case "courier": return "'Courier New', Courier, monospace";
      case "comic": return "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif";
      case "mono":
      default: return "monospace";
    }
  };

  const getBackgroundColor = () => {
    switch(preferences.windowColor) {
      case "dark": return "#111111";
      case "light": return "#f0f0f0";
      default: return undefined;
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Progress Bar Container */}
      <div style={{ 
        width: "100%", 
        height: "8px", 
        backgroundColor: "var(--border)", 
        borderRadius: "4px",
        marginBottom: "15px",
        overflow: "hidden"
      }}>
        {/* Progress Fill */}
        <div style={{
          height: "100%",
          width: `${progressPercentage}%`,
          backgroundColor: "var(--primary)",
          transition: "width 0.1s linear"
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "0.9rem", color: "var(--untyped)" }}>
          Press <kbd>Esc</kbd> to pause
        </div>
        <button 
          onClick={handlePause} 
          className="btn-secondary" 
          disabled={isPaused || currentIndex === content.length}
        >
          Pause Session
        </button>
      </div>
      
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          outline: "none",
          fontSize: getFontSize(),
          lineHeight: "1.8",
          fontFamily: getFontFamily(),
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          position: "relative",
          maxHeight: "60vh",
          overflowY: "auto",
          padding: "20px",
          borderRadius: "12px",
          backgroundColor: getBackgroundColor(),
          filter: isPaused ? "blur(4px)" : "none",
          transition: "filter 0.2s ease",
          color: preferences.windowColor === "light" ? "#111" : undefined
        }}
        className={preferences.windowColor === "glass" ? "glass-panel" : ""}
      >
        {content.split("").map((char, index) => {
          let color = "var(--untyped)";
          if (preferences.windowColor === "light") color = "#888";

          const isTyped = index < currentIndex;
          
          if (isTyped) {
            color = mistakes[index] ? "var(--incorrect)" : "var(--correct)";
          }

          const isCurrent = index === currentIndex;
          
          let displayedChar = char;
          if (!isTyped) {
            if (maskMode === "all") {
               displayedChar = /[a-zA-Z0-9]/.test(char) ? "_" : char;
            } else if (maskMode === "partial") {
               const wordIdx = charToWordIndex[index];
               if (maskedWordIndices.has(wordIdx)) {
                 displayedChar = /[a-zA-Z0-9]/.test(char) ? "_" : char;
               }
            }
          }
          
          return (
            <span
              key={index}
              ref={isCurrent ? currentSpanRef : null}
              style={{
                color,
                background: isCurrent ? (preferences.windowColor === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)") : "transparent",
                borderBottom: isCurrent ? "2px solid var(--primary)" : "none",
              }}
            >
              {char === '\n' ? (
                <>
                  <span style={{ opacity: 0.4 }}>↵</span>
                  <br /><br />
                </>
              ) : displayedChar}
            </span>
          );
        })}
      </div>

      {isPaused && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "12px"
        }}>
          <h2 style={{ fontSize: "3rem", color: "var(--foreground)", marginBottom: "20px" }}>PAUSED</h2>
          <button onClick={handleResume} className="btn-primary" style={{ padding: "12px 24px", fontSize: "1.2rem" }}>
            Resume (or press any key)
          </button>
        </div>
      )}
    </div>
  );
}
