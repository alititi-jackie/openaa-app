"use client";

import { useEffect } from "react";

export default function SearchPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const q = params.get("q") || "";
    const mode = params.get("mode") || "google";

    if (!q) return;

    if (mode === "google") {
      window.location.href =
        `https://www.google.com/search?q=${q}`;
    }

    if (mode === "jobs") {
      window.location.href =
        `https://www.indeed.com/jobs?q=${q}`;
    }

    if (mode === "housing") {
      window.location.href =
        `https://www.zillow.com/homes/${q}`;
    }

    if (mode === "guides") {
      window.location.href =
        `/guides?q=${q}`;
    }

    if (mode === "ai") {
      window.location.href =
        `https://www.perplexity.ai/search?q=${q}`;
    }
  }, []);

  return (
    <main className="home">
      <div className="center-box">
        Redirecting...
      </div>
    </main>
  );
}