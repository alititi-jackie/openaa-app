"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { PageShareButton } from "@/components/common/PageShareButton";
import { DmvDisclaimerCard, DmvFaqSection, DmvInfoSection } from "@/components/dmv/DmvBottomSections";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvLoginPrompt } from "@/components/dmv/DmvLoginPrompt";
import { DmvBackLink, dmvBackLinkClassName } from "@/components/dmv/DmvBackLink";
import { DmvQuestionCard } from "@/components/dmv/DmvQuestionCard";
import { PageTitleCard } from "@/components/PageTitleCard";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { addWrongQuestion, removeWrongQuestion, savePracticeProgress, savePracticeResult, shuffleQuestions } from "@/components/dmv/dmvStorage";
import { getDmvCategoryLabel } from "@/components/dmv/dmvCategoryLabels";
import type { DmvQuestion } from "@/features/dmv/types";

type PracticeMode = "setup" | "practice" | "done";
type OrderMode = "random" | "sequential";
type CountOption = "10" | "20" | "30" | "50" | "all";

const practiceFaq = [
  {
    question: "随机练习和顺序练习有什么区别？",
    answer: "随机练习适合查漏补缺，顺序练习适合系统刷完整题库。两种模式都会在答题后即时显示答案和解释。",
  },
  {
    question: "每次练多少题比较合适？",
    answer: "时间少时可以做 10 或 20 题，考前冲刺建议做 50 题或全部题目，并结合模拟考试检验节奏。",
  },
  {
    question: "答错的题会自动加入错题本吗？",
    answer: "会。答错的题会保存在本机浏览器的错题本里，之后可以到错题练习页面集中复盘。",
  },
];

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
        <DmvPracticeSetupHeader questionCount={questions.length} />

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

        <DmvFaqSection items={practiceFaq} />
        <DmvDisclaimerCard>
          <p>OpenAA 的练习模式仅供 DMV Permit 中文备考参考，不代表 New York DMV 官方考试内容。</p>
          <p>正式考试题目、预约、证件和费用要求，请以 New York DMV 官方系统和现场要求为准。</p>
        </DmvDisclaimerCard>
        <DmvInfoSection>
          <div className="space-y-3">
            <p>
              这个页面是 OpenAA 的纽约 DMV Permit 训练入口，围绕 DMV Permit 题库、DMV 中文笔试、模拟考试、交通标志、Learner Permit 等核心主题设计。许多用户会先搜索“Permit 中文练习”或“纽约 DMV 中文笔试”，再进入练习系统，因此底部保留了完整文字说明，让搜索引擎与首次访问者都能快速理解页面用途。
            </p>
            <p>
              适合使用的人群包括准备第一次参加 Learner Permit 笔试的新移民、想用中文复习规则的华人用户、以及需要集中突破交通标志题的考生。你可以根据自己的进度选择随机练习、顺序练习、错题复盘或完整模拟考试。
            </p>
            <p>
              完成线上练习后，建议结合 DMV 官方流程核对最新政策，包括预约、证件、费用与考试安排。OpenAA 提供中文学习与导航支持，但正式评分和结果仍以纽约 DMV 官方系统为准。
            </p>
            <ul className="space-y-1 font-bold text-slate-700">
              <li>适合用户：准备 DMV 中文笔试的纽约华人、新移民、留学生</li>
              <li>核心功能：随机/顺序练习、模拟考试、错题复盘、交通标志专项</li>
              <li>复习建议：先掌握交通标志与高频规则，再用模拟考试检验 Learner Permit 应试节奏</li>
            </ul>
          </div>
        </DmvInfoSection>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="space-y-4">
        <DmvPracticeLegacyHeader />
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
      <DmvPracticeLegacyHeader />
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

function DmvPracticeSetupHeader({ questionCount }: { questionCount: number }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <DetailBackButton fallbackHref="/dmv" />
        <div className="flex items-center gap-2">
          <FavoriteButton
            target={{ type: "unsupported", message: "DMV 页面收藏暂未接入收藏表，当前不会写入收藏。" }}
            returnTo="/dmv/practice"
          />
          <PageShareButton
            path="/dmv/practice"
            title="随机 / 顺序 DMV 中文练习"
            text="使用完整题库练习：随机或顺序；支持选择题数。"
            label={
              <span className="inline-flex items-center gap-1.5">
                <Share2 size={15} aria-hidden="true" />
                分享
              </span>
            }
          />
        </div>
      </div>
      <ChannelHero title="随机 / 顺序 DMV 中文练习" description="使用完整题库练习：随机或顺序；支持选择题数。" />
      <p className="text-xs font-bold text-slate-400">当前题库：{questionCount} 题</p>
      <DmvHorizontalNav activeValue="practice" />
    </>
  );
}

function DmvPracticeLegacyHeader() {
  return (
    <>
      <PageTitleCard title="DMV 练习模式" description="选择随机或顺序练习、设置题数，答题后立即查看正确与否，并把错题保存在本机浏览器。" eyebrow="DMV" />
      <DmvBackLink />
    </>
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
