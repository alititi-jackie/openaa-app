import type { DmvQuestion } from "./types";

export function isRoadSignCategory(category: string, tags: readonly string[] = []) {
  const normalizedCategory = category.toLowerCase();
  return normalizedCategory.includes("sign") || tags.some((tag) => tag.toLowerCase().includes("sign"));
}

export function isRoadSignQuestion(question: Pick<DmvQuestion, "category" | "tags" | "isRoadSign">) {
  return question.isRoadSign || isRoadSignCategory(question.category, question.tags);
}
