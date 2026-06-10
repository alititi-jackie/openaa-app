"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { addWrongQuestion, removeWrongQuestion } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

type DmvQuestionsBrowserProps = {
  questions: DmvQuestion[];
};

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
      const matchesCategory = category === "all" || question.category === category;
      const matchesSearch =
        !keyword ||
        question.questionText.toLowerCase().includes(keyword) ||
        question.options.some((option) => option.toLowerCase().includes(keyword)) ||
        question.correctAnswer.toLowerCase().includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [category, questions, search]);

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

    const targetTop = target.getBoundingClientRect().top + window.scrollY - 132;
    window.history.replaceState(null, "", "#dmv-question-browser");
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    window.setTimeout(() => {
      if (Math.abs(target.getBoundingClientRect().top - 132) > 12) {
        const scrollingElement = document.scrollingElement ?? document.documentElement;
        scrollingElement.scrollTop = targetTop;
        document.body.scrollTop = targetTop;
      }
    }, 300);
  }

  return (
    <div className="space-y-4">
      <section id="dmv-question-browser" ref={questionBrowserRef} className="scroll-mt-32 space-y-3 md:scroll-mt-28">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-black text-slate-950">查看题库</h2>
          <button
            type="button"
            onClick={() => setRevealAnswer((current) => !current)}
            aria-pressed={revealAnswer}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition active:scale-[0.98] ${
              revealAnswer ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {revealAnswer ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
            {revealAnswer ? "显示答案" : "隐藏答案"}
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索题目、选项或答案"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <p className="text-xs leading-5 text-slate-400">
          共 {questions.length} 题 · {revealAnswer ? "当前显示答案与解析" : "点击选项可以直接答题"}
        </p>

        <HorizontalPillTabs
          tabs={categories.map((item) => ({ value: item, label: item === "all" ? "全部" : getDmvCategoryLabel(item) }))}
          activeValue={category}
          ariaLabel="DMV 题目分类"
          onChange={setCategory}
        />
      </section>

      {filtered.length > 0 ? (
        <div className="space-y-3">
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
        <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          没有找到匹配的题目。
        </section>
      )}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <p className="text-base font-black">🎉 已浏览完题库！</p>
        <p className="mt-1 text-blue-800">登录 OpenAA 后，可同步错题和学习进度；也可以继续回到题库巩固，或进入随机练习检验掌握情况。</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link href="/login?returnTo=/dmv/questions" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-black leading-5 text-white">
            登录 / 注册，解锁更多功能
          </Link>
          <button type="button" onClick={scrollToQuestionBrowser} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
            继续查看题库
          </button>
          <Link href="/dmv/practice" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
            下一步：随机练习
          </Link>
          <Link href="/dmv" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700">
            退出题库
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">常见问题 FAQ</h2>
        <div className="mt-3 space-y-3">
          <FaqItem question="纽约 DMV Permit 要多少题及格？" answer="考试共 20 题，至少答对 14 题，且交通标志题至少答对 2 题。" />
          <FaqItem question="题库有答案解析吗？" answer="有，题库支持查看答案和中文解析，方便理解道路规则与交通标志。" />
          <FaqItem question="看完题库后下一步做什么？" answer="建议先去 Practice 练习，再做 Mock Test 模拟考试检验通过率。" />
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <h3 className="text-sm font-bold text-slate-950">{question}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{answer}</p>
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
