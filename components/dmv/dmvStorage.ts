"use client";

import type { DmvQuestion } from "@/features/dmv/types";

export const DMV_WRONG_KEY = "openaa_dmv_wrong_question_ids";
export const DMV_PRACTICE_PROGRESS_KEY = "openaa_dmv_practice_progress";
export const DMV_PRACTICE_RESULT_KEY = "openaa_dmv_practice_result";
export const DMV_EXAM_RESULT_KEY = "openaa_dmv_exam_result";

export type StoredExamResult = {
  total: number;
  correct: number;
  signCorrect: number;
  passed: boolean;
  finishedAt: string;
};

export function readWrongQuestionIds() {
  try {
    const raw = window.localStorage.getItem(DMV_WRONG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveWrongQuestionIds(ids: string[]) {
  try {
    window.localStorage.setItem(DMV_WRONG_KEY, JSON.stringify([...new Set(ids)]));
  } catch {}
}

export function addWrongQuestion(id: string) {
  saveWrongQuestionIds([...readWrongQuestionIds(), id]);
}

export function removeWrongQuestion(id: string) {
  saveWrongQuestionIds(readWrongQuestionIds().filter((value) => value !== id));
}

export function savePracticeProgress(progress: { currentIndex: number; total: number; answered: number; correct: number }) {
  try {
    window.localStorage.setItem(DMV_PRACTICE_PROGRESS_KEY, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
  } catch {}
}

export function savePracticeResult(result: { total: number; correct: number }) {
  try {
    window.localStorage.setItem(DMV_PRACTICE_RESULT_KEY, JSON.stringify({ ...result, finishedAt: new Date().toISOString() }));
  } catch {}
}

export function saveExamResult(result: StoredExamResult) {
  try {
    window.localStorage.setItem(DMV_EXAM_RESULT_KEY, JSON.stringify(result));
  } catch {}
}

export function shuffleQuestions(questions: DmvQuestion[]) {
  const copy = [...questions];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
