"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [studentId, setStudentId] = useState("");
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onStudentIdChange(value: string) {
    setStudentId(value);
    // Hide prior result/error while editing so nothing "pops up" from the last submit
    setAnonymousId(null);
    setError(null);
  }

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
        <div className={styles.stack}>
          <p className={styles.lead}>
            Enter your student ID to get (or retrieve) your anonymous survey ID.
          </p>
          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.label} htmlFor="studentId">
              Student ID
            </label>
            <input
              id="studentId"
              className={styles.input}
              name="student-id"
              value={studentId}
              onChange={(e) => onStudentIdChange(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !studentId.trim()}
            >
              {loading ? "Working..." : "Get or retrieve your anonymous ID"}
            </button>
          </form>

          {error ? <p className={styles.error}>{error}</p> : null}

          {anonymousId ? (
            <section className={styles.result}>
              <p className={styles.resultLabel}>Your anonymous ID:</p>
              <code className={styles.resultCode}>{anonymousId}</code>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
