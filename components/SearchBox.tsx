"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("jobs");

  const handleSearch = () => {
    if (!query.trim()) return;

    router.push(
      `/search?q=${encodeURIComponent(query)}&mode=${mode}`
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const modes = [
    "jobs",
    "housing",
    "guides",
    "google",
    "ai",
  ];

  return (
    <>
      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="Search jobs, housing, guides..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="mode-bar">
        {modes.map((item) => (
          <button
            key={item}
            className={`mode-btn ${
              mode === item ? "active" : ""
            }`}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </>
  );
}
