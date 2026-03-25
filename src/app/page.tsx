"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [studentId, setStudentId] = useState("");
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setAnonymousId(null);

    try {
      const res = await fetch("/api/anon-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const json = (await res.json()) as { anonymousId?: string; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? "Request failed");
      }

      if (!json.anonymousId) {
        throw new Error("API returned no anonymousId");
      }

      setAnonymousId(json.anonymousId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.lead}>
          Enter your student ID to get (or retrieve) your anonymous survey ID.
        </p>
        <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 520 }}>
          <label htmlFor="studentId" style={{ display: "block", marginBottom: 6 }}>
            Student ID
          </label>
          <input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px" }}
          />
          <button
            type="submit"
            disabled={loading || !studentId.trim()}
            style={{ marginTop: 12, padding: "10px 12px", width: "100%" }}
          >
            {loading ? "Working..." : "Get or retrieve your anonymous ID"}
          </button>
        </form>

        {error ? (
          <p style={{ marginTop: 18, color: "crimson" }}>{error}</p>
        ) : null}

        {anonymousId ? (
          <section style={{ marginTop: 18 }}>
            <p>Your anonymous ID:</p>
            <code style={{ wordBreak: "break-all" }}>{anonymousId}</code>
          </section>
        ) : null}
      </main>
    </div>
  );
}
