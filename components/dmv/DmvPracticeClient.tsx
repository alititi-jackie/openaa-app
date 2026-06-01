"use client";

import { useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion, savePracticeProgress, savePracticeResult, shuffleQuestions } from "@/components/dmv/dmvStorage";
import type { DmvQuestion } from "@/features/dmv/types";

export function DmvPracticeClient({ questions }: { questions: DmvQuestion[] }) {
  const [orderedQuestions, setOrderedQuestions] = useState<DmvQuestion[]>(() => shuffleQuestions(questions));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const currentQuestion = orderedQuestions[currentIndex];
  const answeredCount = Object.keys(selectedById).length;
  const correctCount = useMemo(
    () => orderedQuestions.filter((question) => selectedById[question.id] === question.correctAnswerIndex).length,
    [orderedQuestions, selectedById],
  );

  function restart() {
    setOrderedQuestions(shuffleQuestions(questions));
    setCurrentIndex(0);
    setSelectedById({});
    setIsComplete(false);
  }

  function selectAnswer(optionIndex: number) {
    if (!currentQuestion || selectedById[currentQuestion.id] !== undefined) return;
    const nextSelected = { ...selectedById, [currentQuestion.id]: optionIndex };
    setSelectedById(nextSelected);
    if (optionIndex === currentQuestion.correctAnswerIndex) {
      removeWrongQuestion(currentQuestion.id);
    } else {
      addWrongQuestion(currentQuestion.id);
    }
    savePracticeProgress({
      currentIndex,
      total: orderedQuestions.length,
      answered: Object.keys(nextSelected).length,
      correct: orderedQuestions.filter((question) => nextSelected[question.id] === question.correctAnswerIndex).length,
    });
  }

  function finishPractice() {
    savePracticeResult({ total: orderedQuestions.length, correct: correctCount });
    setIsComplete(true);
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">题库暂未导入</h2>
        <p className="mt-2">当前没有可练习的 DMV 题目。</p>
      </section>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-green-100 bg-green-50 p-5 text-green-900 shadow-sm">
          <h2 className="text-xl font-black">练习完成</h2>
          <p className="mt-2 text-sm leading-6">
            本次练习 {orderedQuestions.length} 题，答对 {correctCount} 题。
          </p>
        </section>
        <DmvLoginPrompt />
        <button type="button" onClick={restart} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
          重新随机练习
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-black text-slate-950">
            {currentIndex + 1} / {orderedQuestions.length}
          </span>
          <span>已答 {answeredCount} 题</span>
        </div>
      </section>

      <DmvQuestionCard
        question={currentQuestion}
        index={currentIndex}
        selectedIndex={selectedById[currentQuestion.id] ?? null}
        onSelect={selectAnswer}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          disabled={currentIndex === 0}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
        >
          上一题
        </button>
        {currentIndex < orderedQuestions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((value) => Math.min(orderedQuestions.length - 1, value + 1))}
            className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
          >
            下一题
          </button>
        ) : (
          <button type="button" onClick={finishPractice} className="min-h-11 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white">
            完成练习
          </button>
        )}
      </div>
    </div>
  );
}
