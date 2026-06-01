"use client";

import { useMemo, useState } from "react";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import type { DmvQuestion } from "@/features/dmv/types";

type DmvQuestionsBrowserProps = {
  questions: DmvQuestion[];
};

export function DmvQuestionsBrowser({ questions }: DmvQuestionsBrowserProps) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [revealAnswer, setRevealAnswer] = useState(false);
  const categories = useMemo(() => ["all", ...Array.from(new Set(questions.map((question) => question.category)))], [questions]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesCategory = category === "all" || question.category === category;
      const matchesSearch =
        !keyword ||
        question.questionText.toLowerCase().includes(keyword) ||
        question.options.some((option) => option.toLowerCase().includes(keyword)) ||
        question.correctAnswer.toLowerCase().includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [category, questions, search]);

  if (questions.length === 0) {
    return <EmptyDmvState />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索题目、选项或答案"
            className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${
                  category === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {item === "all" ? "全部" : item}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={revealAnswer} onChange={(event) => setRevealAnswer(event.target.checked)} />
            显示全部答案
          </label>
        </div>
      </section>

      <p className="text-sm font-bold text-slate-500">共 {filtered.length} 题</p>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((question, index) => (
            <DmvQuestionCard key={question.id} question={question} index={index} revealAnswer={revealAnswer} />
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          没有找到匹配的题目。
        </section>
      )}

    </div>
  );
}

export function EmptyDmvState() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">题库暂未导入</h2>
      <p className="mt-2">当前环境没有可用 DMV 题库数据。请先导入已审计题库到 `dmv_questions`，或确认静态审计题库文件存在。</p>
    </section>
  );
}
