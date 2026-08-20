"use client";

import React, { useState } from "react";

interface ContentGeneratorProps {
  onContentGenerated: (content: string, topic: string) => void;
}

export function ContentGenerator({ onContentGenerated }: ContentGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !file) {
      setError("Please provide either a topic/URL or upload a file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let fileData = undefined;
      let fileMimeType = undefined;
      let finalTopic = topic;

      if (file) {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
        });
        fileData = base64String;
        fileMimeType = file.type;
        
        if (!finalTopic.trim()) {
          finalTopic = file.name;
        }
      }

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic, fileData, fileMimeType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate content");
      }

      const data = await res.json();
      onContentGenerated(data.content, data.title || finalTopic);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto", padding: "32px" }}>
      <h2 style={{ marginBottom: "20px" }}>What do you want to learn?</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "var(--untyped)" }}>
            Enter an URL
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
            placeholder="URL"
            disabled={loading}
          />
        </div>
        
        <div style={{ textAlign: "center", color: "var(--untyped)" }}>OR</div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "var(--untyped)" }}>
            Upload a File (.txt, .pdf)
          </label>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="input-field"
            disabled={loading}
            style={{ padding: "10px" }}
          />
        </div>



        {error && <div style={{ color: "var(--incorrect)", fontSize: "0.9rem" }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
          {loading ? "Generating..." : "Generate & Start Typing"}
        </button>
      </form>
    </div>
  );
}
