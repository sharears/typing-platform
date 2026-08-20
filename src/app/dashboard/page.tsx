"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ContentGenerator } from "@/components/ContentGenerator";
import { TypingInterface } from "@/components/TypingInterface";
import { ReviewSession } from "@/components/ReviewSession";
import { PreferencesMenu } from "@/components/PreferencesMenu";
import { usePreferences } from "@/components/PreferencesContext";
import { WordCountChart } from "@/components/WordCountChart";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences } = usePreferences();

  const [mode, setMode] = useState<"idle" | "generating" | "typing" | "results" | "reviewing">("idle");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<{ wpm: number; errorRate: number } | null>(null);
  const [insight, setInsight] = useState<string>("Loading your typing insights...");
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [dueItems, setDueItems] = useState<any[]>([]);

  useEffect(() => {
    if (status === "authenticated" && mode === "idle") {
      fetch("/api/analyze-trends")
        .then(res => res.json())
        .then(data => {
          if (data.insight) setInsight(data.insight);
        })
        .catch(() => setInsight("Failed to load insights."));

      fetch("/api/review")
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) {
            setDueReviewsCount(data.count);
            setDueItems(data.items);
          }
        })
        .catch(console.error);
    }
  }, [status, mode]);

  if (status === "loading") {
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleContentGenerated = (generatedContent: string, generatedTopic: string) => {
    setContent(generatedContent);
    setTopic(generatedTopic);
    setMode("typing");
  };

  const handleTypingComplete = async (wpm: number, errorRate: number, detailedMistakes: any[]) => {
    setResults({ wpm, errorRate });
    setMode("results");

    // Save session
    try {
      await fetch("/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wpm, errorRate, content, topic, detailedMistakes }),
      });
    } catch (err) {
      console.error("Failed to save session", err);
    }
  };

  const handleEmailMe = async () => {
    try {
      alert("Sending email...");
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topic }),
      });
      if (res.ok) {
        alert("Email sent successfully!");
      } else {
        alert("Failed to send email");
      }
    } catch (e) {
      alert("Error sending email");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "2rem" }}>Welcome, {session?.user?.name}</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          {mode !== "idle" && (
            <button onClick={() => setMode("idle")} className="btn-secondary">
              Back to Dashboard
            </button>
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      {mode === "idle" && (
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }}>
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", gap: "20px" }}>
            <h2>Ready to learn?</h2>
            <button onClick={() => setMode("generating")} className="btn-primary" style={{ padding: "16px 32px", fontSize: "1.2rem" }}>
              Start New Session
            </button>
            {dueReviewsCount > 0 && (
              <button onClick={() => setMode("reviewing")} className="btn-secondary" style={{ padding: "16px 32px", fontSize: "1.2rem", marginTop: "10px" }}>
                Practice Due Reviews ({dueReviewsCount})
              </button>
            )}
          </div>
          
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column" }}>
            <h2>Your Insights</h2>
            <p style={{ marginTop: "16px", color: "var(--untyped)", lineHeight: "1.6" }}>
              {insight}
            </p>
            <WordCountChart />
          </div>
        </div>
      )}

      {mode === "generating" && (
        <ContentGenerator onContentGenerated={handleContentGenerated} />
      )}

      {mode === "typing" && (
        <div style={{ 
          maxWidth: preferences.windowWidth === "narrow" ? "600px" : preferences.windowWidth === "wide" ? "1000px" : "800px", 
          margin: "0 auto",
          transition: "max-width 0.3s ease"
        }}>
          <h2 style={{ marginBottom: "20px", color: "var(--untyped)", fontSize: "1.2rem" }}>
            Typing Session: {topic}
          </h2>
          <TypingInterface content={content} onComplete={handleTypingComplete} />
        </div>
      )}

      {mode === "reviewing" && (
        <ReviewSession items={dueItems} onComplete={() => setMode("idle")} />
      )}

      {mode === "results" && results && (
        <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2>Session Complete!</h2>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--primary)" }}>{results.wpm}</div>
              <div style={{ color: "var(--untyped)" }}>WPM</div>
            </div>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--incorrect)" }}>{results.errorRate.toFixed(1)}%</div>
              <div style={{ color: "var(--untyped)" }}>Error Rate</div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "20px" }}>
            <button onClick={handleCopy} className="btn-secondary">Copy Text</button>
            <button onClick={handleEmailMe} className="btn-primary">Email Me</button>
            <button onClick={() => setMode("idle")} className="btn-secondary">Finish</button>
          </div>
        </div>
      )}

      <PreferencesMenu />
    </div>
  );
}
