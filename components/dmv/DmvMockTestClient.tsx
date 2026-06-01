"use client";

import { useMemo, useState } from "react";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion, saveExamResult, shuffleQuestions } from "@/components/dmv/dmvStorage";
import type { DmvQuestion } from "@/features/dmv/types";

const examSize = 20;
const passCorrectCount = 14;
const passSignCorrectCount = 2;

export function DmvMockTestClient({ questions }: { questions: DmvQuestion[] }) {
  const [examQuestions, setExamQuestions] = useState<DmvQuestion[]>(() => buildExam(questions));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => buildResult(examQuestions, answers), [answers, examQuestions]);

  function restart() {
    setExamQuestions(buildExam(questions));
    setAnswers({});
    setSubmitted(false);
  }

  function submitExam() {
    for (const question of examQuestions) {
      if (answers[question.id] === question.correctAnswerIndex) {
        removeWrongQuestion(question.id);
      } else {
        addWrongQuestion(question.id);
      }
    }
    saveExamResult({ ...result, finishedAt: new Date().toISOString() });
    setSubmitted(true);
  }

  if (questions.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">题库暂未导入</h2>
        <p className="mt-2">当前没有可用于模拟考试的 DMV 题目。</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">纽约 DMV 模拟考试规则</h2>
        <p className="mt-2">20 题，至少答对 14 题，交通标志题至少答对 2 题。考试提交前不显示答案。</p>
        <p className="mt-1">已答 {Object.keys(answers).length} / {examQuestions.length}</p>
      </section>

      {submitted ? (
        <section className={`rounded-2xl border p-5 shadow-sm ${result.passed ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"}`}>
          <h2 className={`text-xl font-black ${result.passed ? "text-green-900" : "text-red-900"}`}>
            {result.passed ? "模拟考试通过" : "模拟考试未通过"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            答对 {result.correct} / {result.total} 题；交通标志题答对 {result.signCorrect} 题。
          </p>
        </section>
      ) : null}

      <div className="space-y-3">
        {examQuestions.map((question, index) => (
          <DmvQuestionCard
            key={question.id}
            question={question}
            index={index}
            selectedIndex={answers[question.id] ?? null}
            revealAnswer={submitted}
            disabled={submitted}
            onSelect={(optionIndex) => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
          />
        ))}
      </div>

      {submitted ? (
        <>
          <DmvLoginPrompt />
          <button type="button" onClick={restart} className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
            重新模拟考试
          </button>
        </>
      ) : (
        <button type="button" onClick={submitExam} className="min-h-12 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white">
          提交考试
        </button>
      )}
    </div>
  );
}

function buildExam(questions: DmvQuestion[]) {
  const signs = shuffleQuestions(questions.filter((question) => question.isRoadSign)).slice(0, 4);
  const others = shuffleQuestions(questions.filter((question) => !question.isRoadSign)).slice(0, Math.max(0, examSize - signs.length));
  const exam = shuffleQuestions([...signs, ...others]).slice(0, examSize);
  return exam.length > 0 ? exam : questions.slice(0, examSize);
}

function buildResult(questions: DmvQuestion[], answers: Record<string, number>) {
  const correct = questions.filter((question) => answers[question.id] === question.correctAnswerIndex).length;
  const signCorrect = questions.filter((question) => question.isRoadSign && answers[question.id] === question.correctAnswerIndex).length;
  return {
    total: questions.length,
    correct,
    signCorrect,
    passed: correct >= Math.min(passCorrectCount, questions.length) && signCorrect >= Math.min(passSignCorrectCount, questions.filter((question) => question.isRoadSign).length),
  };
}
