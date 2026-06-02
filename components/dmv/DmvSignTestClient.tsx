"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion, shuffleQuestions } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

type SignTestPhase = "intro" | "practice" | "done";

export function DmvSignTestClient({ questions }: { questions: DmvQuestion[] }) {
  const signQuestions = useMemo(() => questions.filter(isSignQuestion), [questions]);
  const [phase, setPhase] = useState<SignTestPhase>("intro");
  const [practiceQuestions, setPracticeQuestions] = useState<DmvQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [result, setResult] = useState({ total: 0, correct: 0, wrong: 0 });

  const currentQuestion = practiceQuestions[currentIndex];
  const answeredCount = Object.keys(selectedById).length;
  const correctCount = useMemo(
    () => practiceQuestions.filter((question) => selectedById[question.id] === question.correctAnswerIndex).length,
    [practiceQuestions, selectedById],
  );
  const wrongCount = answeredCount - correctCount;
  const correctRate = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);

  function startPractice() {
    const nextQuestions = shuffleQuestions(signQuestions);
    setPracticeQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelectedById({});
    setResult({ total: 0, correct: 0, wrong: 0 });
    setPhase(nextQuestions.length > 0 ? "practice" : "intro");
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
  }

  function goNext() {
    if (!currentQuestion || selectedById[currentQuestion.id] === undefined) return;
    if (currentIndex >= practiceQuestions.length - 1) {
      setResult({ total: practiceQuestions.length, correct: correctCount, wrong: wrongCount });
      setPhase("done");
      return;
    }
    setCurrentIndex((value) => Math.min(practiceQuestions.length - 1, value + 1));
  }

  function exitPractice() {
    setCurrentIndex(0);
    setSelectedById({});
    setPhase("intro");
  }

  if (phase === "practice" && currentQuestion) {
    const progress = ((currentIndex + 1) / practiceQuestions.length) * 100;
    const currentAnswered = selectedById[currentQuestion.id] !== undefined;

    return (
      <div className="space-y-4">
        <section className="sticky top-14 z-20 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-slate-950">
              {currentIndex + 1} / {practiceQuestions.length}
            </span>
            <span>正确 {correctCount} 题</span>
            <span>错误 {wrongCount} 题</span>
          </div>
        </section>

        <DmvQuestionCard
          question={currentQuestion}
          index={currentIndex}
          categoryLabel={getDmvCategoryLabel(currentQuestion.category)}
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
          <button
            type="button"
            onClick={goNext}
            disabled={!currentAnswered}
            className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
          >
            {currentIndex >= practiceQuestions.length - 1 ? "完成练习" : "下一题"}
          </button>
        </div>

        <div className="flex justify-center">
          <button type="button" onClick={exitPractice} className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-black text-slate-600">
            退出练习 / 返回入口
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const finalRate = result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);

    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">交通标志练习完成</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <ScoreCard label="总题数" value={result.total} tone="slate" />
            <ScoreCard label="答对" value={result.correct} tone="green" />
            <ScoreCard label="答错" value={result.wrong} tone="red" />
            <ScoreCard label="正确率" value={`${finalRate}%`} tone="blue" />
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startPractice} className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
            再练一次
          </button>
          <Link href="/dmv/mock-test" className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">
            去模拟考试
          </Link>
          <Link href="/dmv/wrong-questions" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-700">
            去错题练习
          </Link>
          <Link href="/dmv/questions" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
            去题库
          </Link>
          <Link href="/dmv" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 sm:col-span-2">
            返回 DMV 首页
          </Link>
        </div>

        <DmvLoginPrompt />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">交通标志专项练习</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          从 OpenAA 整理练习题中筛选交通标志相关题目，随机练习并即时查看答案解释。答错会加入本机错题本，答对会从错题本移除。
        </p>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前交通标志题：{signQuestions.length} 题</p>
      </section>

      {signQuestions.length > 0 ? (
        <button type="button" onClick={startPractice} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
          开始交通标志练习
        </button>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          当前题库里还没有可用的交通标志题。
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dmv/questions" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
          查看题库
        </Link>
        <Link href="/dmv/mock-test" className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">
          模拟考试
        </Link>
      </div>
    </div>
  );
}

function isSignQuestion(question: DmvQuestion) {
  return question.isRoadSign || question.category.includes("sign") || question.tags.some((tag) => tag.toLowerCase().includes("sign"));
}

function ScoreCard({ label, value, tone }: { label: string; value: number | string; tone: "green" | "red" | "blue" | "slate" }) {
  const colorClass = {
    green: "border-green-100 bg-green-50 text-green-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    slate: "border-slate-100 bg-white text-slate-600",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${colorClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}
