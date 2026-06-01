"use client";

import type { DmvQuestion } from "@/features/dmv/types";

type DmvQuestionCardProps = {
  question: DmvQuestion;
  index: number;
  selectedIndex?: number | null;
  revealAnswer?: boolean;
  disabled?: boolean;
  onSelect?: (index: number) => void;
};

export function DmvQuestionCard({ question, index, selectedIndex = null, revealAnswer = false, disabled = false, onSelect }: DmvQuestionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">第 {index + 1} 题</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{question.category}</span>
        {question.isRoadSign ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">交通标志</span> : null}
      </div>

      <h2 className="mt-3 text-base font-black leading-7 text-slate-950">{question.questionText}</h2>

      {question.imageUrl ? (
        <div className="mt-3 flex justify-center rounded-xl bg-slate-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.imageUrl} alt="DMV question visual" className="max-h-44 max-w-full object-contain" loading="lazy" />
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {question.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctAnswerIndex;
          const isSelected = optionIndex === selectedIndex;
          const showState = revealAnswer || selectedIndex !== null;
          const stateClass =
            showState && isCorrect
              ? "border-green-200 bg-green-50 text-green-800"
              : showState && isSelected
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-800";

          return (
            <button
              key={`${question.id}-${optionIndex}`}
              type="button"
              disabled={disabled || revealAnswer}
              onClick={() => onSelect?.(optionIndex)}
              className={`min-h-12 rounded-xl border px-3 py-3 text-left text-sm font-bold leading-6 transition active:scale-[0.99] disabled:cursor-default ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {revealAnswer || selectedIndex !== null ? (
        <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm leading-6 text-green-800">
          <p className="font-black">正确答案：{question.correctAnswer}</p>
          {question.explanation ? <p className="mt-1">{question.explanation}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
