"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  BookOpen,
  Car,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  MapPin,
  RefreshCw,
  Shuffle,
  X,
} from "lucide-react";
import { DmvFaqSection, DmvLearningDisclaimerCard, DmvSeoContentSection } from "@/components/dmv/DmvBottomSections";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { dmvSeoContent } from "@/components/dmv/dmvSeoContent";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { DetailShareCard } from "@/components/posts/DetailShareCard";
import { cn } from "@/lib/utils/cn";

type DmvGuidePost = {
  id: string;
  title: string;
  href: string;
};

type DmvHomeClientProps = {
  questionCount: number;
  guides: DmvGuidePost[];
};

const practiceCards = [
  {
    title: "查看题库",
    desc: "按分类筛选与搜索，支持边看边做题。",
    href: "/dmv/questions",
    Icon: BookMarked,
    tone: "blue",
  },
  {
    title: "随机 / 顺序练习",
    desc: "全题库随机或顺序练习，答题后立即显示正确答案和解释。",
    href: "/dmv/practice",
    Icon: Shuffle,
    tone: "orange",
  },
  {
    title: "模拟考试",
    desc: "按 DMV 规则出题，提交后立即看结果。",
    href: "/dmv/mock-test",
    Icon: ClipboardList,
    tone: "green",
  },
  {
    title: "错题练习",
    desc: "自动汇总错题，集中练习薄弱题目。",
    href: "/dmv/wrong-questions",
    Icon: AlertCircle,
    tone: "red",
  },
] as const;

const quickTools = [
  { title: "罚单查询", desc: "交通罚单与处理指引", href: "/dmv/tickets", Icon: AlertTriangle, external: false },
  { title: "纽约 DMV 笔试练习", desc: "查看题库、练习模式、模拟考试与错题练习", href: "#dmv-practice-section", Icon: BookOpen, external: false, scrollTarget: "dmv-practice-section" },
  { title: "DMV 小工具", desc: "文件检查、6 Points、REAL ID 工具", href: "/dmv#dmv-quick-tools-section", Icon: Car, external: false },
  { title: "驾照申请", desc: "Learner Permit 官方入口", href: "https://dmv.ny.gov/driver-license/get-learner-permit", Icon: FileText, external: true },
  { title: "驾照更新", desc: "到期续期与资料要求", href: "https://dmv.ny.gov/driver-license/renew-license", Icon: RefreshCw, external: true },
  { title: "地址变更", desc: "搬家后地址更新入口", href: "https://dmv.ny.gov/address-change/how-change-your-address", Icon: MapPin, external: true },
] as const;

const officialLinks = [
  { title: "NY DMV 官网", desc: "纽约州 DMV 官方首页，具体规则以官网最新信息为准。", href: "https://dmv.ny.gov/" },
  { title: "Learner Permit 申请", desc: "学习驾照申请入口与所需材料说明。", href: "https://dmv.ny.gov/driver-license/get-learner-permit" },
  { title: "Road Test 路考预约", desc: "官方路考预约与流程说明。", href: "https://dmv.ny.gov/driver-license/schedule-and-take-road-test" },
  { title: "License Renewal 驾照更新", desc: "驾照续期入口，具体费用与流程以官网为准。", href: "https://dmv.ny.gov/driver-license/renew-license" },
  { title: "Vehicle Registration 车辆注册", desc: "车辆注册、过户与牌照相关官方入口。", href: "https://dmv.ny.gov/registration" },
  { title: "Change Address 地址变更", desc: "地址变更官方说明与办理入口。", href: "https://dmv.ny.gov/address-change" },
  { title: "Traffic Tickets 交通罚单", desc: "纽约州交通罚单查询与处理入口。", href: "https://dmv.ny.gov/tickets" },
  { title: "NYC Parking Tickets 停车罚单", desc: "纽约市停车罚单查询与缴费入口。", href: "https://www.nyc.gov/site/finance/vehicles/services-violation.page" },
];

const localServices = ["驾校", "汽车保险", "翻译公证", "罚单律师", "修车服务", "二手车买卖"];

const dmvFaq = [
  {
    question: "纽约 DMV Permit 要多少题及格？",
    answer: "纽约 DMV Permit 笔试共 20 题，至少答对 14 题，且交通标志题至少答对 2 题。",
  },
  {
    question: "纽约 DMV 可以考中文吗？",
    answer: "可以，纽约 DMV Permit 笔试支持简体中文。",
  },
  {
    question: "纽约 Permit 通过后多久能预约路考？",
    answer: "通过 Permit 后需先满足练车要求，再预约 Road Test。",
  },
];

const SCROLL_OFFSET = 132;

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET);
  const alignTarget = () => {
    const correction = target.getBoundingClientRect().top - SCROLL_OFFSET;
    if (Math.abs(correction) > 8) {
      window.scrollBy({
        top: correction,
        behavior: "auto",
      });
    }
  };

  window.history.pushState(null, "", `#${sectionId}`);
  window.scrollTo({
    top: targetTop,
    behavior: "smooth",
  });
  window.setTimeout(alignTarget, 700);
  window.setTimeout(alignTarget, 1100);
}

const processDetails = [
  {
    title: "准备身份证明和地址证明",
    prepare: [
      "纽约申请 Learner Permit / Driver License 前，需要准备 DMV 认可的身份证明、年龄证明和纽约地址证明。",
      "纽约 DMV 使用 6 分身份证明规则，Proof of Name 文件加起来通常要达到至少 6 分。",
      "Standard Permit / License 通常需要 1 份纽约地址证明。",
      "REAL ID / Enhanced 通常需要 2 份纽约地址证明。",
    ],
    howTo: [
      "当前地址必须显示在地址证明文件上；P.O. Box 通常不能作为地址证明。",
      "具体文件和分值以 NY DMV 官方 ID-44 / Document Guide 为准。",
      "最稳做法：去 DMV 前先用官方 Document Guide 检查资料是否够分。",
    ],
    notes: [
      "中国护照、绿卡、工卡、社安卡、美国银行卡/银行账单、水电费账单、租房合同、保险/学校/政府信件等，可能可作为不同类型证明。",
      "但是否可用、占几分，以官方 Document Guide / ID-44 为准。",
      "不同身份类型（游客、工卡、绿卡、公民等）要求可能不同，请以 DMV 官方要求为准。",
      "资料不够不要直接预约去考试，容易白跑。",
      "最省事方式：找驾校或熟悉 DMV 的人帮你先检查资料；想 DIY 自己办理，再按步骤继续。",
    ],
    links: [
      { label: "ID-44 文件清单", href: "https://dmv.ny.gov/forms/id44.pdf", external: true },
      { label: "DMV Document Guide", href: "https://dmv.ny.gov/more-info/dmv-document-guide", external: true },
    ],
  },
  {
    title: "申请 Learner Permit",
    prepare: ["资料准备好后，普通小车一般选择 Class D Learner Permit。", "需要填写 MV-44 表格：Application for Permit, Driver License or Non-Driver ID Card。"],
    howTo: ["DMV 有中文 MV-44 表格，可提前下载填写；也可现场填写。", "英文不好要确认申请的是普通小车 Class D Learner Permit。", "可通过 Office Locations 查询办公室，有些服务可预约。"],
    notes: ["非美国公民：MV-44 中涉及 voter registration / 选民登记要认真看，不要误勾。"],
    links: [
      { label: "预约考试时间", href: "https://dmv.ny.gov/driver-license/get-learner-permit", external: true },
      { label: "下载中文 MV-44", href: "https://dmv.ny.gov/forms/mv44ch.pdf", external: true },
    ],
  },
  {
    title: "参加 DMV 笔试",
    prepare: ["带齐身份证明、地址证明、MV-44 和付款方式。"],
    howTo: [
      "通常流程：视力测试、交材料、拍照、缴费、笔试。",
      "通过后一般有临时 Learner Permit，正式文件可能邮寄。",
      "纽约 Class D 笔试规则：20 题，至少对 14 题，并且 4 道交通标志题至少对 2 道。",
      "纽约 DMV 笔试支持中文，考试时可选择中文。",
    ],
    notes: ["费用以官方/现场为准；付款方式以官方/办公室为准。", "建议提前在 OpenAA 做中文题库练习和模拟。"],
    links: [
      { label: "练习试题", href: "/dmv/practice" },
      { label: "DMV 费用说明", href: "https://dmv.ny.gov/driver-license/fees-refunds", external: true },
    ],
  },
  {
    title: "拿到学习驾照后练车",
    prepare: ["Learner Permit 后不能自己单独开车。", "必须按纽约规定，在合格持证驾驶员陪同下练车。"],
    howTo: ["建议驾校或有经验者陪练，熟悉纽约道路与常见项目（停车/转弯/让行/Stop Sign/路边停车等）。", "练车随身携带 Learner Permit。"],
    notes: ["年龄/地点/时间段可能有额外限制，以官方 learner permit restrictions 为准。", "别急着约路考，先把基本动作练稳定。"],
    links: [{ label: "查看 NY DMV 新手驾照流程", href: "https://dmv.ny.gov/driver-license/get-learner-permit", external: true }],
  },
  {
    title: "预约路考",
    prepare: ["路考前通常需完成 5 小时 Pre-Licensing Course，或符合 DMV 认可 Driver Education。"],
    howTo: [
      "预约所需：1）有效 NYS Learner Permit 2）有效 MV-278 或 MV-285 3）考试地点 ZIP Code 4）至少 1 次未使用的 road test 机会。",
      "等待时间可能几周，旺季更久，以系统为准。",
      "不一定必须在居住 county，可按可预约地点选择。",
    ],
    notes: ["成功后确认日期时间地点，并安排考试车辆。", "路考需要符合要求的考试车辆，并需有合法驾驶员陪同。"],
    links: [
      { label: "5 小时课程说明", href: "https://dmv.ny.gov/driver-license/the-driver-pre-licensing-course", external: true },
      { label: "预约路考", href: "https://dmv.ny.gov/driver-license/schedule-and-take-a-road-test", external: true },
    ],
  },
  {
    title: "通过后领取正式驾照",
    prepare: ["路考通过后按指示领取临时驾照/查看结果。"],
    howTo: ["正式驾照通常邮寄到 DMV 记录地址。", "确认地址正确；搬家及时更新。", "未收到按指引查询处理。"],
    notes: ["未通过则继续练习再预约。"],
    links: [
      { label: "NY DMV Driver License 首页", href: "https://dmv.ny.gov/driver-license", external: true },
      { label: "路考页面", href: "https://dmv.ny.gov/driver-license/schedule-and-take-a-road-test", external: true },
    ],
  },
];

export function DmvHomeClient({ questionCount, guides }: DmvHomeClientProps) {
  const [modalStep, setModalStep] = useState<number | null>(null);
  const processStepTitles = useMemo(() => processDetails.map((step) => step.title), []);

  return (
    <>
      <ChannelHero
        title="DMV 工具中心"
        description="纽约 DMV 笔试、路考、罚单查询、驾照申请及常用工具入口。"
      />
      <DmvHorizontalNav activeValue="tools" />

      <section id="dmv-practice-section" className="scroll-mt-[132px]">
        <h2 className="text-base font-black text-slate-950">纽约 DMV 笔试练习</h2>
        <p className="mt-1 text-xs text-slate-500">中文题库 · {questionCount} 题 · 无需登录 · 支持错题练习</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {practiceCards.map((card) => (
            <PracticeCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <button
          type="button"
          onClick={() => scrollToSection("dmv-quick-tools-section")}
          className="rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-950">DMV 快捷工具入口</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">驾照申请、驾照更新、地址变更、罚单查询等常用 DMV 官方入口。</p>
            </div>
            <Car size={18} className="shrink-0 text-blue-600" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
            查看快捷工具
            <ArrowRight size={14} />
          </span>
        </button>
        <DetailShareCard
          path="/dmv"
          title="OpenAA DMV 工具中心"
          text="纽约 DMV 笔试练习、驾照申请、地址变更、罚单查询等常用入口。"
        />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">纽约华人 DMV 中文学习平台</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          这里集中提供 NY DMV 学习入口：Permit 笔试练习、Practice Test、Road Test 流程说明、DMV 教程与 tickets 查询，帮助纽约华人、新移民与留学生更快上手。
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
          <li>Permit 中文练习与模拟考试</li>
          <li>交通标志 Road Signs 专项训练</li>
          <li>DMV 教程与新手办证流程</li>
          <li>停车罚单 / 超速罚单 / 红灯罚单查询</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <PillLink href="/dmv/practice" className="bg-blue-50 text-blue-700">中文练习</PillLink>
          <PillLink href="/dmv/mock-test" className="bg-green-50 text-green-700">模拟考试</PillLink>
          <PillLink href="/dmv/sign-test" className="bg-orange-50 text-orange-700">交通标志</PillLink>
          <PillLink href="/news?category=dmv-guide" className="bg-slate-100 text-slate-700">DMV 教程</PillLink>
          <PillLink href="/dmv/tickets" className="bg-amber-50 text-amber-700">罚单查询</PillLink>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setModalStep(0)}
          className="flex items-center gap-1 rounded-md text-left text-base font-black text-slate-950 transition hover:bg-slate-50 active:bg-slate-100"
        >
          新手办驾照流程
          <ChevronRight size={14} className="text-slate-400" />
        </button>
        <div className="mt-3 space-y-2">
          {processStepTitles.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => setModalStep(index)}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 active:bg-slate-100"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                <span className="text-sm text-slate-700">{step}</span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </section>

      <section id="dmv-quick-tools-section" className="scroll-mt-[132px]">
        <h2 className="text-base font-black text-slate-950">DMV 快捷工具</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {quickTools.map((item) => (
            <ToolCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">官方入口</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {officialLinks.map((item) => (
            <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-950">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{item.desc}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-400" />
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">DMV 相关本地服务</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {localServices.map((item) => (
            <Link key={item} href="/services" className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition active:bg-slate-100">
              {item}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Link href="/news?category=dmv-guide" className="text-base font-black text-slate-950">
          DMV 教程文章
        </Link>
        <div className="mt-2 divide-y divide-slate-100">
          {guides.length > 0 ? (
            guides.map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-slate-700">{item.title}</span>
                <ChevronRight size={15} className="shrink-0 text-slate-400" />
              </Link>
            ))
          ) : (
            <p className="py-3 text-sm text-slate-400">暂无 DMV 教程文章</p>
          )}
        </div>
      </section>

      <DmvFaqSection items={dmvFaq} />

      <DmvLearningDisclaimerCard />

      <DmvSeoContentSection {...dmvSeoContent.home} />

      <DmvLicenseProcessModal key={modalStep ?? "closed"} initialStep={modalStep ?? 0} open={modalStep !== null} onClose={() => setModalStep(null)} />
    </>
  );
}

function ToolCard({ item }: { item: (typeof quickTools)[number] }) {
  const Icon = item.Icon;
  const scrollTarget = "scrollTarget" in item ? item.scrollTarget : undefined;
  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon size={16} />
          </span>
          <span className="mt-2 block text-sm font-bold text-slate-950">{item.title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">{item.desc}</span>
        </span>
        <ChevronRight size={14} className="mt-1 shrink-0 text-slate-400" />
      </span>
    </>
  );

  const className = "rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]";

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  if (scrollTarget) {
    return (
      <button
        type="button"
        className={`w-full ${className}`}
        onClick={() => scrollToSection(scrollTarget)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

function PracticeCard({ card }: { card: (typeof practiceCards)[number] }) {
  const Icon = card.Icon;
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-500",
  }[card.tone];

  return (
    <Link href={card.href} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition active:scale-[0.98]">
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", toneClass)}>
            <Icon size={16} />
          </span>
          <span className="mt-2 block text-sm font-bold text-slate-950">{card.title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">{card.desc}</span>
        </span>
        <ChevronRight size={14} className="mt-1 shrink-0 text-slate-400" />
      </span>
    </Link>
  );
}

function PillLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn("rounded-full px-3 py-1.5 font-bold", className)}>
      {children}
    </Link>
  );
}

function DmvLicenseProcessModal({ open, initialStep, onClose }: { open: boolean; initialStep: number; onClose: () => void }) {
  const [expandedStep, setExpandedStep] = useState(initialStep);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button type="button" aria-label="关闭弹窗遮罩" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-2xl md:inset-x-1/2 md:bottom-auto md:top-1/2 md:max-h-[85vh] md:w-[calc(100%-2rem)] md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">纽约新手办驾照流程</h3>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">纽约 DMV 新手中文办理参考</p>
            </div>
            <button type="button" onClick={onClose} aria-label="关闭流程详情弹窗" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-3 md:px-5">
          <div className="space-y-3">
            {processDetails.map((step, index) => {
              const isOpen = expandedStep === index;
              return (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50">
                  <button type="button" className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left" onClick={() => setExpandedStep(isOpen ? -1 : index)}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                      <span className="text-sm font-bold text-slate-800">{step.title}</span>
                    </span>
                    {isOpen ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
                  </button>
                  {isOpen ? (
                    <div className="space-y-4 border-t border-slate-200 bg-white px-3 py-3 text-sm">
                      <StepBlock title="需要准备什么" items={step.prepare} />
                      <StepBlock title="怎样做" items={step.howTo} />
                      <StepBlock title="注意事项" items={step.notes} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-950">相关按钮 / 官方链接</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {step.links.map((link) =>
                            link.external ? (
                              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                                {link.label}
                              </a>
                            ) : (
                              <Link key={link.href} href={link.href} className="inline-flex min-h-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                                {link.label}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            以上内容为 OpenAA 根据纽约 DMV 官方资料整理的中文办事参考，实际要求可能因身份类型、申请类型、DMV 办公室和政策更新而不同。办理前请以 NY DMV 官方网站和现场工作人员要求为准。
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              返回 DMV 首页
            </button>
            <Link href="/" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-bold text-slate-700">
              返回总首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-950">{title}</h4>
      <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
