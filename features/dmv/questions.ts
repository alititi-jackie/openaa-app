import "server-only";

import auditedQuestionBank from "@/data/dmv/openaa-ny-dmv-questions-v1.json";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isRoadSignCategory } from "./questionPredicates";
import type { DmvQuestion, DmvQuestionBank } from "./types";

type JsonRecord = Record<string, unknown>;

type AuditedQuestion = {
  id: number;
  category: string;
  question: string;
  image?: string | null;
  options: string[];
  answerIndex: number;
  answerText: string;
  explanation?: string | null;
  difficulty?: string | null;
  tags?: string[];
};

const defaultDisclaimer = "OpenAA 纽约 DMV 中文练习题库仅供学习参考，实际考试内容以 New York DMV 官方资料为准。";

export async function getDmvQuestionBank(): Promise<DmvQuestionBank> {
  const supabase = createSupabasePublicClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("dmv_questions")
      .select("id,category,question_text,options,correct_answer,explanation,difficulty,source_version,sort_order,metadata")
      .eq("state", "NY")
      .eq("language", "zh-CN")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      const questions = data.map((row) => mapDatabaseQuestion(row as JsonRecord)).filter((item): item is DmvQuestion => item !== null);
      if (questions.length > 0) {
        return {
          questions,
          source: "supabase",
          sourceVersion: stringOrNull(data[0]?.source_version),
          disclaimer: defaultDisclaimer,
        };
      }
    }
  }

  const meta = auditedQuestionBank._meta;
  const questions = (auditedQuestionBank.questions as AuditedQuestion[]).map(mapAuditedQuestion);

  return {
    questions,
    source: questions.length > 0 ? "audited_json" : "empty",
    sourceVersion: meta.version ?? null,
    disclaimer: meta.disclaimer || defaultDisclaimer,
  };
}

function mapDatabaseQuestion(row: JsonRecord): DmvQuestion | null {
  const optionsRecord = asRecord(row.options);
  const choices = Array.isArray(optionsRecord.choices)
    ? optionsRecord.choices.map((item) => String(item)).filter(Boolean)
    : Array.isArray(row.options)
      ? row.options.map((item) => String(item)).filter(Boolean)
      : [];
  const correctAnswer = String(row.correct_answer ?? "");
  const answerIndex =
    typeof optionsRecord.answerIndex === "number"
      ? optionsRecord.answerIndex
      : Math.max(
          0,
          choices.findIndex((choice) => choice === correctAnswer),
        );
  const legacyId = String(optionsRecord.legacyId ?? row.id ?? "");
  const tags = Array.isArray(optionsRecord.tags) ? optionsRecord.tags.map((item) => String(item)) : [];
  const metadata = asRecord(row.metadata);

  if (!row.id || !row.category || !row.question_text || choices.length === 0 || !correctAnswer) {
    return null;
  }

  return {
    id: String(row.id),
    legacyId,
    category: String(row.category),
    questionText: String(row.question_text),
    imageUrl: stringOrNull(metadata.image_url),
    options: choices,
    correctAnswerIndex: answerIndex,
    correctAnswer,
    explanation: stringOrNull(row.explanation),
    difficulty: stringOrNull(row.difficulty),
    tags,
    isRoadSign: isRoadSignCategory(String(row.category), tags),
    sortOrder: numberOrZero(row.sort_order),
  };
}

function mapAuditedQuestion(question: AuditedQuestion): DmvQuestion {
  return {
    id: `legacy-${question.id}`,
    legacyId: String(question.id),
    category: question.category,
    questionText: question.question,
    imageUrl: question.image ?? null,
    options: question.options,
    correctAnswerIndex: question.answerIndex,
    correctAnswer: question.answerText,
    explanation: question.explanation ?? null,
    difficulty: question.difficulty ?? null,
    tags: question.tags ?? [],
    isRoadSign: isRoadSignCategory(question.category, question.tags ?? []),
    sortOrder: question.id,
  };
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
