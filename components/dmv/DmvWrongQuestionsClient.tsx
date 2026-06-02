"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { dmvBackLinkClassName } from "@/components/dmv/DmvBackLink";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, readWrongQuestionIds, removeWrongQuestion, saveWrongQuestionIds } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

type WrongPhase = "list" | "practice" | "done";
type WrongFilter = "all" | "signs";

export function DmvWrongQuestionsClient({ questions }: { questions: DmvQuestion[] }) {
  const [phase, setPhase] = useState<WrongPhase>("list");
  const [filter, setFilter] = useState<WrongFilter>("all");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<DmvQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [result, setResult] = useState({ total: 0, correct: 0, wrong: 0, remaining: 0 });

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

  const signWrongCount = useMemo(() => wrongQuestions.filter((question) => question.isRoadSign).length, [wrongQuestions]);
  const filteredWrongQuestions = useMemo(
    () => (filter === "signs" ? wrongQuestions.filter((question) => question.isRoadSign) : wrongQuestions),
    [filter, wrongQuestions],
  );
  const currentQuestion = practiceQuestions[currentIndex];
  const answeredCount = Object.keys(selectedById).length;
  const correctCount = useMemo(
    () => practiceQuestions.filter((question) => selectedById[question.id] === question.correctAnswerIndex).length,
    [practiceQuestions, selectedById],
  );
  const wrongCount = answeredCount - correctCount;

  function refreshWrongIds() {
    const nextIds = readWrongQuestionIds();
    setWrongIds(nextIds);
    return nextIds;
  }

  function startPractice() {
    if (filteredWrongQuestions.length === 0) return;
    setPracticeQuestions(filteredWrongQuestions);
    setCurrentIndex(0);
    setSelectedById({});
    setResult({ total: 0, correct: 0, wrong: 0, remaining: wrongIds.length });
    setPhase("practice");
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
    refreshWrongIds();
  }

  function finishPractice() {
    const nextWrongIds = refreshWrongIds();
    setResult({
      total: practiceQuestions.length,
      correct: correctCount,
      wrong: wrongCount,
      remaining: nextWrongIds.length,
    });
    setPhase("done");
  }

  function goNext() {
    if (!currentQuestion || selectedById[currentQuestion.id] === undefined) return;
    if (currentIndex >= practiceQuestions.length - 1) {
      finishPractice();
      return;
    }
    setCurrentIndex((value) => Math.min(practiceQuestions.length - 1, value + 1));
  }

  function clearWrongQuestions() {
    const confirmed = window.confirm("确定清空错题本吗？清空后这些错题记录会从本机浏览器移除。");
    if (!confirmed) return;
    saveWrongQuestionIds([]);
    setWrongIds([]);
    setPracticeQuestions([]);
    setSelectedById({});
    setResult({ total: 0, correct: 0, wrong: 0, remaining: 0 });
    setPhase("list");
  }

  function backToList() {
    refreshWrongIds();
    setPracticeQuestions([]);
    setSelectedById({});
    setCurrentIndex(0);
    setPhase("list");
  }

  if (phase === "practice" && currentQuestion) {
    const progress = ((currentIndex + 1) / practiceQuestions.length) * 100;
    const currentAnswered = selectedById[currentQuestion.id] !== undefined;

    return (
      <div className="space-y-4">
        <section className="sticky top-14 z-20 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-slate-950">
              {currentIndex + 1} / {practiceQuestions.length}
            </span>
            <span>已答 {answeredCount} 题</span>
            <span>{filter === "signs" ? "交通标志错题" : "全部错题"}</span>
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
          <button type="button" onClick={backToList} className={dmvBackLinkClassName}>
            退出错题练习 / 返回错题列表
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const finalRate = result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);

    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">错题练习完成</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <ScoreCard label="本次题数" value={result.total} tone="slate" />
            <ScoreCard label="答对" value={result.correct} tone="green" />
            <ScoreCard label="答错" value={result.wrong} tone="red" />
            <ScoreCard label="正确率" value={`${finalRate}%`} tone="blue" />
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">当前剩余错题：{result.remaining} 道</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startPractice} disabled={filteredWrongQuestions.length === 0} className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300">
            再练一次
          </button>
          <button type="button" onClick={backToList} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            返回错题列表
          </button>
          <Link href="/dmv/practice" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700">
            去练习模式
          </Link>
          <Link href="/dmv/mock-test" className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">
            去模拟考试
          </Link>
          <Link href="/dmv" className={`${dmvBackLinkClassName} sm:col-span-2`}>
            返回 DMV 首页
          </Link>
        </div>

        <DmvLoginPrompt />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/dmv" className={dmvBackLinkClassName}>
        返回 DMV 首页
      </Link>

      <section className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">错题本</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <ScoreCard label="错题总数" value={wrongQuestions.length} tone="red" />
          <ScoreCard label="交通标志错题" value={signWrongCount} tone="amber" />
        </div>
      </section>

      {wrongQuestions.length === 0 ? (
        <EmptyWrongQuestions />
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${filter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                全部错题
              </button>
              <button
                type="button"
                onClick={() => setFilter("signs")}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${filter === "signs" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                只看交通标志错题
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startPractice}
                disabled={filteredWrongQuestions.length === 0}
                className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300"
              >
                开始错题练习
              </button>
              <button type="button" onClick={clearWrongQuestions} className="min-h-12 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                清空错题本
              </button>
            </div>
          </section>

          {filteredWrongQuestions.length > 0 ? (
            <section className="space-y-3">
              {filteredWrongQuestions.map((question, index) => (
                <WrongQuestionPreview key={question.id} question={question} index={index} />
              ))}
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              当前筛选下没有错题。
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyWrongQuestions() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm leading-6 text-slate-600 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">还没有错题</h2>
      <p className="mt-2">题库、练习模式或模拟考试中答错的题目，会保存在本机浏览器的错题本里。</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link href="/dmv/questions" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          去题库练习
        </Link>
        <Link href="/dmv/practice" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
          去练习模式
        </Link>
        <Link href="/dmv/mock-test" className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black text-green-700">
          去模拟考试
        </Link>
      </div>
    </section>
  );
}

function WrongQuestionPreview({ question, index }: { question: DmvQuestion; index: number }) {
  const categoryLabel = getDmvCategoryLabel(question.category);

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">错题 {index + 1}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{categoryLabel}</span>
        {question.isRoadSign && categoryLabel !== "交通标志" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">标志题</span> : null}
      </div>
      <p className="mt-3 text-sm font-black leading-6 text-slate-950">{question.questionText}</p>
      {question.imageUrl ? (
        <div className="mt-3 flex justify-center rounded-xl bg-slate-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.imageUrl} alt="DMV question visual" className="max-h-32 max-w-full object-contain" loading="lazy" />
        </div>
      ) : null}
    </article>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: number | string; tone: "green" | "red" | "blue" | "slate" | "amber" }) {
  const colorClass = {
    green: "border-green-100 bg-green-50 text-green-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    slate: "border-slate-100 bg-white text-slate-600",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${colorClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}
