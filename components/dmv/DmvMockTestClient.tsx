"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion, saveExamResult, shuffleQuestions } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

const examSize = 20;
const examSignCount = 4;
const passCorrectCount = 14;
const passSignCorrectCount = 2;

type MockPhase = "intro" | "exam" | "result";

export function DmvMockTestClient({ questions }: { questions: DmvQuestion[] }) {
  const [phase, setPhase] = useState<MockPhase>("intro");
  const [examQuestions, setExamQuestions] = useState<DmvQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitWarning, setSubmitWarning] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const currentQuestion = examQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, examQuestions.length - answeredCount);
  const result = useMemo(() => buildResult(examQuestions, answers), [answers, examQuestions]);

  function startExam() {
    const nextExam = buildExam(questions);
    setExamQuestions(nextExam);
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setSubmitWarning("");
    setShareMessage("");
    setPhase(nextExam.length > 0 ? "exam" : "intro");
  }

  function selectAnswer(optionIndex: number) {
    if (!currentQuestion) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
    setSubmitWarning("");
  }

  function goPrevious() {
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    setCurrentIndex((value) => Math.min(examQuestions.length - 1, value + 1));
  }

  function submitExam({ force = false } = {}) {
    if (unansweredCount > 0 && !force && submitWarning === "") {
      setSubmitWarning(`还有 ${unansweredCount} 道题未作答。请补全后提交，或再次点击提交考试。`);
      return;
    }

    for (const question of examQuestions) {
      if (answers[question.id] === question.correctAnswerIndex) {
        removeWrongQuestion(question.id);
      } else {
        addWrongQuestion(question.id);
      }
    }

    const elapsed = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    setElapsedSeconds(elapsed);
    saveExamResult({ total: result.total, correct: result.correct, signCorrect: result.signCorrect, passed: result.passed, finishedAt: new Date().toISOString() });
    setPhase("result");
  }

  async function shareResult() {
    const text = `我在 OpenAA DMV 模拟考试中答对 ${result.correct}/${result.total} 题，交通标志 ${result.signCorrect}/${result.signTotal}，${result.passed ? "通过" : "继续练习"}。`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "OpenAA DMV 模拟考试", text });
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setShareMessage("考试结果已复制");
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
        <p className="mt-2">当前没有可用于模拟考试的 DMV 题目。</p>
      </section>
    );
  }

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">纽约 DMV 模拟考试说明</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            本模拟考试使用 OpenAA 整理练习题。每次 20 题，其中 4 道交通标志题；总正确数至少 14 题，并且交通标志题至少答对 2 题才算通过。
          </p>
          <ul className="mt-4 space-y-2 text-sm font-bold text-slate-700">
            <li>总共 20 道题目</li>
            <li>包含 4 道交通标志题</li>
            <li>作答过程中不显示答案，提交后统一查看结果</li>
            <li>未登录也可以完整使用，结果只保存在本机</li>
          </ul>
        </section>

        <button type="button" onClick={startExam} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
          开始考试
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dmv/practice" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
            去练习模式
          </Link>
          <Link href="/dmv/questions" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700">
            查看题库
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "exam" && currentQuestion) {
    const progress = ((currentIndex + 1) / examQuestions.length) * 100;

    return (
      <div className="space-y-4">
        <section className="sticky top-14 z-20 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-slate-950">
              {currentIndex + 1} / {examQuestions.length}
            </span>
            <span>已答 {answeredCount} 题</span>
            <span>标志题 4 道</span>
          </div>
        </section>

        <DmvQuestionCard
          question={currentQuestion}
          index={currentIndex}
          categoryLabel={getDmvCategoryLabel(currentQuestion.category)}
          selectedIndex={answers[currentQuestion.id] ?? null}
          feedbackMode="selected"
          onSelect={selectAnswer}
        />

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-slate-500">题目概览</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {examQuestions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${
                  index === currentIndex
                    ? "bg-blue-600 text-white"
                    : answers[question.id] !== undefined
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>

        {submitWarning ? <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-800">{submitWarning}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
          >
            上一题
          </button>
          {currentIndex < examQuestions.length - 1 ? (
            <button type="button" onClick={goNext} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
              下一题
            </button>
          ) : (
            <button type="button" onClick={() => submitExam({ force: submitWarning !== "" })} className="min-h-11 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white">
              提交考试
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <Link href="/dmv" className="rounded-xl border border-red-100 bg-red-50 px-5 py-2 text-sm font-black text-red-600">
            退出考试 / 返回 DMV 首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-5 shadow-sm ${result.passed ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"}`}>
        <h2 className={`text-xl font-black ${result.passed ? "text-green-900" : "text-red-900"}`}>
          {result.passed ? "模拟考试通过" : "模拟考试未通过"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          答对 {result.correct} / {result.total} 题，交通标志答对 {result.signCorrect} / {result.signTotal} 题。
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <ScoreCard label="正确" value={result.correct} tone="green" />
        <ScoreCard label="错误" value={result.wrong} tone="red" />
        <ScoreCard label="未答" value={result.unanswered} tone="slate" />
        <ScoreCard label="正确率" value={`${result.correctRate}%`} tone="blue" />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h3 className="font-black text-slate-950">考试用时</h3>
        <p className="mt-1 text-sm font-bold text-slate-600">{formatDuration(elapsedSeconds)}</p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <h3 className="font-black text-slate-950">通过标准</h3>
        <p className={result.correct >= passCorrectCount ? "mt-2 font-bold text-green-700" : "mt-2 font-bold text-red-600"}>
          20 题中至少答对 14 题：当前 {result.correct} 题
        </p>
        <p className={result.signCorrect >= passSignCorrectCount ? "font-bold text-green-700" : "font-bold text-red-600"}>
          4 道交通标志题至少答对 2 题：当前 {result.signCorrect} 题
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-black text-slate-950">答题详情</h3>
        {examQuestions.map((question, index) => {
          const selectedIndex = answers[question.id] ?? null;
          const isCorrect = selectedIndex === question.correctAnswerIndex;
          return (
            <article
              key={question.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${isCorrect ? "border-green-100" : selectedIndex === null ? "border-slate-100" : "border-red-100"}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">第 {index + 1} 题</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{getDmvCategoryLabel(question.category)}</span>
                {question.isRoadSign ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">交通标志</span> : null}
              </div>
              <p className="mt-3 text-sm font-black leading-6 text-slate-950">{question.questionText}</p>
              {question.imageUrl ? (
                <div className="mt-3 flex justify-center rounded-xl bg-slate-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={question.imageUrl} alt="DMV question visual" className="max-h-36 max-w-full object-contain" loading="lazy" />
                </div>
              ) : null}
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <p className={isCorrect ? "font-black text-green-700" : "font-black text-red-600"}>
                  用户答案：{selectedIndex === null ? "未作答" : question.options[selectedIndex]}
                </p>
                <p className="mt-1 font-black text-green-700">正确答案：{question.correctAnswer}</p>
                {question.explanation ? <p className="mt-1">{question.explanation}</p> : null}
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={startExam} className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
          重新考试
        </button>
        <Link href="/dmv/wrong-questions" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-700">
          去错题练习
        </Link>
        <Link href="/dmv/practice" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700">
          去练习模式
        </Link>
        <button type="button" onClick={shareResult} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          分享结果
        </button>
        <Link href="/dmv" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 sm:col-span-2">
          返回 DMV 首页
        </Link>
      </div>

      {shareMessage ? <p className="text-center text-xs font-bold text-blue-600">{shareMessage}</p> : null}
      <DmvLoginPrompt />
    </div>
  );
}

function buildExam(questions: DmvQuestion[]) {
  const signs = shuffleQuestions(questions.filter((question) => question.isRoadSign)).slice(0, examSignCount);
  const others = shuffleQuestions(questions.filter((question) => !question.isRoadSign)).slice(0, Math.max(0, examSize - signs.length));
  return shuffleQuestions([...signs, ...others]).slice(0, examSize);
}

function buildResult(questions: DmvQuestion[], answers: Record<string, number>) {
  const correct = questions.filter((question) => answers[question.id] === question.correctAnswerIndex).length;
  const signQuestions = questions.filter((question) => question.isRoadSign);
  const signCorrect = signQuestions.filter((question) => answers[question.id] === question.correctAnswerIndex).length;
  const unanswered = questions.filter((question) => answers[question.id] === undefined).length;
  const wrong = Math.max(0, questions.length - correct - unanswered);
  return {
    total: questions.length,
    correct,
    wrong,
    unanswered,
    correctRate: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
    signTotal: signQuestions.length,
    signCorrect,
    passed: questions.length === examSize && correct >= passCorrectCount && signCorrect >= passSignCorrectCount,
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} 秒`;
  return `${minutes} 分 ${rest} 秒`;
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
