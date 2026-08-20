"use client";

import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "16px" }} className="gradient-text">
        Learn Anything by Typing
      </h1>
      <p style={{ fontSize: "1.25rem", color: "var(--untyped)", maxWidth: "600px", marginBottom: "40px" }}>
        Provide a link or material and the site will generate a simple text. Type out the text to improve your typing speed while absorbing the knowledge!
      </p>
      
      {status === "unauthenticated" && (
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "400px" }}>
          <h2>Sign In</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--untyped)" }}>Sign in to track your progress</p>
            <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
              const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
              signIn("credentials", { email, password, callbackUrl: "/dashboard" });
            }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <input name="email" type="email" placeholder="Email Address" required className="input-field" />
            <input name="password" type="password" placeholder="Password" required className="input-field" />
            <button type="submit" className="btn-primary">Sign In / Register</button>
          </form>
        </div>
      )}

      {status === "loading" && <p>Loading...</p>}
      
      {status === "authenticated" && (
        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">
            Go to Dashboard
          </button>
          <button onClick={() => signOut()} className="btn-secondary">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
