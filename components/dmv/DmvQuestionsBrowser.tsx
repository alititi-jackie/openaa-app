"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { DmvFaqSection } from "@/components/dmv/DmvBottomSections";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import { isRoadSignQuestion } from "@/features/dmv/questionPredicates";
import type { DmvQuestion } from "@/features/dmv/types";

type DmvQuestionsBrowserProps = {
  questions: DmvQuestion[];
};

const questionBrowserFaq = [
  {
    question: "纽约 DMV Permit 要多少题及格？",
    answer: "考试共 20 题，至少答对 14 题，且交通标志题至少答对 2 题。",
  },
  {
    question: "题库有答案解析吗？",
    answer: "有，题库支持查看答案和中文解析，方便理解道路规则与交通标志。",
  },
  {
    question: "看完题库后下一步做什么？",
    answer: "建议先去 Practice 练习，再做 Mock Test 模拟考试检验通过率。",
  },
];

const STICKY_TOP_FALLBACK = 69;

function getStickyTopOffset() {
  if (typeof document === "undefined") return STICKY_TOP_FALLBACK;
  const header = document.querySelector("header");
  return Math.ceil(header?.getBoundingClientRect().height ?? STICKY_TOP_FALLBACK);
}

export function DmvQuestionsBrowser({ questions }: DmvQuestionsBrowserProps) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [selectedById, setSelectedById] = useState<Record<string, number>>({});
  const questionBrowserRef = useRef<HTMLElement | null>(null);
  const categories = useMemo(() => ["all", ...Array.from(new Set(questions.map((question) => question.category)))], [questions]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesCategory = category === "all" || (category === "traffic-signs" ? isRoadSignQuestion(question) : question.category === category);
      const matchesSearch =
        !keyword ||
        question.questionText.toLowerCase().includes(keyword) ||
        question.options.some((option) => option.toLowerCase().includes(keyword)) ||
        question.correctAnswer.toLowerCase().includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [category, questions, search]);
  const activeCategoryLabel = category === "all" ? "全部" : getDmvCategoryLabel(category);
  const questionCountHint = revealAnswer
    ? `共 ${filtered.length} 题 · ${activeCategoryLabel}`
    : `共 ${filtered.length} 题 · ${activeCategoryLabel} · 点击选项可以直接答题`;

  if (questions.length === 0) {
    return <EmptyDmvState />;
  }

  function selectAnswer(question: DmvQuestion, optionIndex: number) {
    setSelectedById((current) => ({ ...current, [question.id]: optionIndex }));
    if (optionIndex === question.correctAnswerIndex) {
      removeWrongQuestion(question.id);
    } else {
      addWrongQuestion(question.id);
    }
  }

  function scrollToQuestionBrowser() {
    const target = questionBrowserRef.current;
    if (!target) return;

    const stickyTop = getStickyTopOffset();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - stickyTop;
    window.history.replaceState(null, "", "#dmv-question-browser");
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    window.setTimeout(() => {
      if (Math.abs(target.getBoundingClientRect().top - stickyTop) > 12) {
        const scrollingElement = document.scrollingElement ?? document.documentElement;
        scrollingElement.scrollTop = targetTop;
        document.body.scrollTop = targetTop;
      }
    }, 300);
  }

  return (
    <div>
      <section
        id="dmv-question-browser"
        ref={questionBrowserRef}
        className="sticky top-[69px] z-40 scroll-mt-[69px] rounded-t-2xl border border-slate-100 bg-white px-3 pb-1 pt-2 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-zinc-900">查看题库</h2>
          <button
            type="button"
            onClick={() => setRevealAnswer((current) => !current)}
            aria-pressed={revealAnswer}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
              revealAnswer ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {revealAnswer ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}
            {revealAnswer ? "显示答案" : "隐藏答案"}
          </button>
        </div>
        <HorizontalPillTabs
          className="mt-1"
          tabs={categories.map((item) => ({ value: item, label: item === "all" ? "全部" : getDmvCategoryLabel(item) }))}
          activeValue={category}
          ariaLabel="DMV 题目分类"
          onChange={setCategory}
        />
      </section>

      <section className="rounded-b-2xl border border-t-0 border-slate-100 bg-white px-3 pb-2 pt-2 shadow-sm">
        <div className="relative">
          <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索题目、选项或答案"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-8 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-blue-300 focus:bg-white"
          />
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-400">{questionCountHint}</p>
      </section>

      {filtered.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filtered.map((question, index) => (
            <DmvQuestionCard
              key={question.id}
              question={question}
              index={index}
              categoryLabel={getDmvCategoryLabel(question.category)}
              selectedIndex={selectedById[question.id] ?? null}
              revealAnswer={revealAnswer}
              onSelect={(optionIndex) => selectAnswer(question, optionIndex)}
            />
          ))}
        </div>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          没有找到匹配的题目。
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <p className="text-base font-black">🎉 已浏览完题库！</p>
        <p className="mt-1 text-blue-800">建议继续随机练习，巩固知识点并检验学习成果。</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={scrollToQuestionBrowser} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
            继续查看
          </button>
          <Link href="/dmv/practice" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-black leading-5 text-white">
            随机练习
          </Link>
        </div>
      </section>

      <div className="mt-3 flex justify-center">
        <Link href="/dmv" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
          退出浏览
        </Link>
      </div>

      <div className="mt-4">
        <DmvLoginPrompt />
      </div>

      <div className="mt-4">
        <DmvFaqSection items={questionBrowserFaq} />
      </div>
    </div>
  );
}

export function EmptyDmvState() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">题库暂未导入</h2>
      <p className="mt-2">当前环境没有可用 DMV 题库数据。请先导入已审计题库到 `dmv_questions`，或确认静态题库文件存在。</p>
    </section>
  );
}
