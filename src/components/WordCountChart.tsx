"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DailyStat {
  date: string;
  words: number;
}

export function WordCountChart() {
  const [data, setData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/word-stats")
      .then((res) => res.json())
      .then((stats) => {
        if (Array.isArray(stats)) {
          setData(stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: "var(--untyped)", textAlign: "center", padding: "20px" }}>Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div style={{ color: "var(--untyped)", textAlign: "center", padding: "20px" }}>No typing data available yet.</div>;
  }

  return (
    <div className="glass-panel" style={{ width: "100%", height: "300px", display: "flex", flexDirection: "column", marginTop: "24px" }}>
      <h2 style={{ marginBottom: "20px" }}>Daily Words Typed (Last 14 Days)</h2>
      <div style={{ flex: 1, width: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--untyped)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--untyped)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} 
            />
            <Bar dataKey="words" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
