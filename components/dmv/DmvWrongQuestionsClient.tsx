"use client";

import { useEffect, useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { readWrongQuestionIds, removeWrongQuestion } from "@/components/dmv/dmvStorage";
import type { DmvQuestion } from "@/features/dmv/types";

export function DmvWrongQuestionsClient({ questions }: { questions: DmvQuestion[] }) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setWrongIds(readWrongQuestionIds());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const wrongQuestions = useMemo(() => {
    const idSet = new Set(wrongIds);
    return questions.filter((question) => idSet.has(question.id));
  }, [questions, wrongIds]);

  function selectAnswer(question: DmvQuestion, optionIndex: number) {
    setSelectedById((current) => ({ ...current, [question.id]: optionIndex }));
    if (optionIndex === question.correctAnswerIndex) {
      removeWrongQuestion(question.id);
      const nextWrongIds = readWrongQuestionIds();
      setWrongIds(nextWrongIds);
      setCompleted(nextWrongIds.length === 0);
    }
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">暂无错题</h2>
          <p className="mt-2">练习或模拟考试答错后，题目会保存在本机浏览器中。</p>
        </section>
        {completed ? <DmvLoginPrompt /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-500">共 {wrongQuestions.length} 道错题。答对后会自动从本机错题中移除。</p>
      <div className="space-y-3">
        {wrongQuestions.map((question, index) => (
          <DmvQuestionCard
            key={question.id}
            question={question}
            index={index}
            selectedIndex={selectedById[question.id] ?? null}
            onSelect={(optionIndex) => selectAnswer(question, optionIndex)}
          />
        ))}
      </div>
    </div>
  );
}
