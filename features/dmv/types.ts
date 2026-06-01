export type DmvQuestion = {
  id: string;
  legacyId: string;
  category: string;
  questionText: string;
  imageUrl: string | null;
  options: string[];
  correctAnswerIndex: number;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string | null;
  tags: string[];
  isRoadSign: boolean;
  sortOrder: number;
};

export type DmvQuestionBank = {
  questions: DmvQuestion[];
  source: "supabase" | "audited_json" | "empty";
  sourceVersion: string | null;
  disclaimer: string;
};
