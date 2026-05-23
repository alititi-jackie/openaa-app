"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  const params = useSearchParams();

  const q = params.get("q") || "";
  const mode = params.get("mode") || "google";

  useEffect(() => {
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
  }, [q, mode]);

  return (
    <main className="home">
      <div className="center-box">
        Redirecting...
      </div>
    </main>
  );
}
