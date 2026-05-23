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
    { key: "jobs", label: "找工作" },
    { key: "housing", label: "找房子" },
    { key: "guides", label: "生活指南" },
    { key: "google", label: "谷歌搜索" },
    { key: "ai", label: "AI搜索" },
  ];

  return (
    <>
      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="搜索工作、房屋、生活信息..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="mode-bar">
        {modes.map((item) => (
          <button
            key={item.key}
            className={`mode-btn ${
              mode === item.key ? "active" : ""
            }`}
            onClick={() => setMode(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}