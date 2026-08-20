"use client";

import React, { useState } from "react";
import { TypingInterface } from "./TypingInterface";

interface ReviewSessionProps {
  items: any[];
  onComplete: () => void;
}

export function ReviewSession({ items, onComplete }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<"recall" | "hint" | "fill-in-the-blank" | "typing">("recall");
  
  if (currentIndex >= items.length) {
    onComplete();
    return null;
  }

  const currentItem = items[currentIndex];

  const handleNext = async (quality: number) => {
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: currentItem.id, quality })
      });
    } catch (e) {
      console.error(e);
    }
    
    setStage("recall");
    setCurrentIndex(currentIndex + 1);
  };

  const handleTypingComplete = (wpm: number, errorRate: number) => {
    // Calculate Spaced Repetition Quality (0-3)
    let quality = 2; // good
    if (stage === "hint" || stage === "fill-in-the-blank") quality = 1; // hard
    if (errorRate > 10 || wpm < 30) quality = 0; // failed
    if (wpm > 60 && errorRate < 2 && stage === "typing") quality = 3; // easy
    
    handleNext(quality);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>
        Reviewing Item {currentIndex + 1} of {items.length}
      </h2>
      
      <div className="glass-panel" style={{ marginBottom: "20px", padding: "20px" }}>
        <h3 style={{ fontSize: "1.5rem", color: "var(--foreground)" }}>{currentItem.question}</h3>
      </div>

      {stage === "recall" && (
        <div className="glass-panel" style={{ padding: "20px" }}>
          <p style={{ color: "var(--untyped)", marginBottom: "20px" }}>
            Try to recall the exact answer from memory. If you are confident, start typing. If you are stuck, you can request a hint or reveal some blanks.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-primary" onClick={() => setStage("typing")}>I Remember It (Type Answer)</button>
            {currentItem.hint && (
              <button className="btn-secondary" onClick={() => setStage("hint")}>Show Hint</button>
            )}
            <button className="btn-secondary" onClick={() => setStage("fill-in-the-blank")}>Fill in the Blanks</button>
          </div>
        </div>
      )}

      {stage === "hint" && (
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <div style={{ padding: "16px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", marginBottom: "20px" }}>
            <strong>Hint:</strong> {currentItem.hint}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-primary" onClick={() => setStage("typing")}>Got it (Type Answer)</button>
            <button className="btn-secondary" onClick={() => setStage("fill-in-the-blank")}>Fill in the Blanks Instead</button>
          </div>
        </div>
      )}

      {(stage === "fill-in-the-blank" || stage === "typing") && (
        <div>
           <TypingInterface 
             content={currentItem.answer} 
             maskMode={stage === "fill-in-the-blank" ? "partial" : "all"} 
             onComplete={handleTypingComplete} 
           />
        </div>
      )}
    </div>
  );
}
