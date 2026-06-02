"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { dmvBackLinkClassName } from "@/components/dmv/DmvBackLink";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion, savePracticeProgress, savePracticeResult, shuffleQuestions } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

type PracticeMode = "setup" | "practice" | "done";
type OrderMode = "random" | "sequential";
type CountOption = "10" | "20" | "30" | "50" | "all";

export function DmvPracticeClient({ questions }: { questions: DmvQuestion[] }) {
  const [mode, setMode] = useState<PracticeMode>("setup");
  const [orderMode, setOrderMode] = useState<OrderMode>("random");
  const [countOption, setCountOption] = useState<CountOption>("20");
  const [practiceQuestions, setPracticeQuestions] = useState<DmvQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const [shareMessage, setShareMessage] = useState("");

  const currentQuestion = practiceQuestions[currentIndex];
  const answeredCount = Object.keys(selectedById).length;
  const correctCount = useMemo(
    () => practiceQuestions.filter((question) => selectedById[question.id] === question.correctAnswerIndex).length,
    [practiceQuestions, selectedById],
  );
  const wrongCount = answeredCount - correctCount;
  const correctRate = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
  const currentAnswered = currentQuestion ? selectedById[currentQuestion.id] !== undefined : false;

  function buildPracticeQuestions() {
    const base = orderMode === "random" ? shuffleQuestions(questions) : [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
    if (countOption === "all") return base;
    return base.slice(0, Number(countOption));
  }

  function startPractice() {
    const nextQuestions = buildPracticeQuestions();
    setPracticeQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelectedById({});
    setShareMessage("");
    setMode(nextQuestions.length > 0 ? "practice" : "setup");
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
      total: practiceQuestions.length,
      answered: Object.keys(nextSelected).length,
      correct: practiceQuestions.filter((question) => nextSelected[question.id] === question.correctAnswerIndex).length,
    });
  }

  function goPrevious() {
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    if (!currentAnswered) return;
    if (currentIndex >= practiceQuestions.length - 1) {
      savePracticeResult({ total: practiceQuestions.length, correct: correctCount });
      setMode("done");
      return;
    }
    setCurrentIndex((value) => Math.min(practiceQuestions.length - 1, value + 1));
  }

  async function shareResult() {
    const text = `我在 OpenAA DMV 中文练习中答对 ${correctCount}/${practiceQuestions.length} 题，正确率 ${correctRate}%。`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "OpenAA DMV 中文练习", text });
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setShareMessage("练习结果已复制");
        window.setTimeout(() => setShareMessage(""), 1800);
      } catch {
        setShareMessage("暂时无法复制");
      }
    }
  }

  if (questions.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">题库暂未导入</h2>
        <p className="mt-2">当前没有可练习的 DMV 题目。</p>
      </section>
    );
  }

  if (mode === "setup") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">开始 DMV 中文练习</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            选择随机或顺序练习，再选择本次题数。答题后会立即显示正确答案和解释，错题会保存在本机浏览器中。
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">当前题库：{questions.length} 题</p>
        </section>

        <section className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            练习顺序
            <select
              value={orderMode}
              onChange={(event) => setOrderMode(event.target.value as OrderMode)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="random">随机练习</option>
              <option value="sequential">顺序练习</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            本次题数
            <select
              value={countOption}
              onChange={(event) => setCountOption(event.target.value as CountOption)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="10">10 题</option>
              <option value="20">20 题</option>
              <option value="30">30 题</option>
              <option value="50">50 题</option>
              <option value="all">全部题目</option>
            </select>
          </label>
        </section>

        <button type="button" onClick={startPractice} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
          开始练习
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dmv/questions" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
            查看题库
          </Link>
          <Link href="/dmv/sign-test" className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-black text-amber-700">
            交通标志专项
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">练习完成</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <ScoreCard label="正确" value={correctCount} tone="green" />
            <ScoreCard label="错误" value={wrongCount} tone="red" />
            <ScoreCard label="正确率" value={`${correctRate}%`} tone="blue" />
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startPractice} className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
            再来一次
          </button>
          <Link href="/dmv/wrong-questions" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-700">
            去错题练习
          </Link>
          <Link href="/dmv/mock-test" className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">
            模拟考试
          </Link>
          <Link href="/dmv/sign-test" className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-black text-amber-700">
            交通标志专项
          </Link>
          <button type="button" onClick={shareResult} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            分享结果
          </button>
          <Link href="/dmv" className={dmvBackLinkClassName}>
            返回 DMV 首页
          </Link>
        </div>

        {shareMessage ? <p className="text-center text-xs font-bold text-blue-600">{shareMessage}</p> : null}
        <DmvLoginPrompt />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">题目加载异常</h2>
        <button type="button" onClick={() => setMode("setup")} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
          返回练习入口
        </button>
      </section>
    );
  }

  const progress = ((currentIndex + 1) / practiceQuestions.length) * 100;

  return (
    <div className="space-y-4">
      <section className="sticky top-14 z-20 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-black text-slate-950">
            {currentIndex + 1} / {practiceQuestions.length}
          </span>
          <span>已答 {answeredCount} 题</span>
          <span>
            {orderMode === "random" ? "随机练习" : "顺序练习"} · {countOption === "all" ? "全部题目" : `${countOption} 题`}
          </span>
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
          onClick={goPrevious}
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
        <button type="button" onClick={() => setMode("setup")} className={dmvBackLinkClassName}>
          退出练习
        </button>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: number | string; tone: "green" | "red" | "blue" }) {
  const colorClass = {
    green: "border-green-100 bg-green-50 text-green-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${colorClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}
