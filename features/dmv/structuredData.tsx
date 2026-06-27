import "server-only";

import { canonicalUrl, siteConfig } from "@/lib/seo/siteConfig";

export type DmvStructuredDataPage = "home" | "questions" | "practice" | "mock-test" | "sign-test" | "tickets";

type DmvFaqItem = {
  question: string;
  answer: string;
};

type DmvPageStructuredData = {
  name: string;
  description: string;
  path: string;
  faq: DmvFaqItem[];
};

const dmvPages: Record<DmvStructuredDataPage, DmvPageStructuredData> = {
  home: {
    name: "2026 纽约 DMV 中文驾照指南",
    description: "纽约 DMV 中文学习入口，包含 Permit 笔试练习、模拟考试、交通标志、罚单查询、驾照申请和路考流程。",
    path: "/dmv",
    faq: [
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
    ],
  },
  questions: {
    name: "纽约 DMV 中文题库与答案解析",
    description: "NY DMV Permit 中文题库，覆盖交通标志、道路规则和常见易错点，支持查看答案和中文解析。",
    path: "/dmv/questions",
    faq: [
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
    ],
  },
  practice: {
    name: "纽约 DMV Permit 中文练习",
    description: "纽约 DMV 中文练习模式，支持随机练习、顺序练习、不同题量选择和答题后即时解析。",
    path: "/dmv/practice",
    faq: [
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
    ],
  },
  "mock-test": {
    name: "纽约 DMV 中文模拟考试",
    description: "纽约 DMV Permit 中文模拟考试，按 20 题节奏练习，提交后查看结果和答题详情。",
    path: "/dmv/mock-test",
    faq: [
      {
        question: "模拟考试的通过标准是什么？",
        answer: "本页按纽约 DMV Permit 常见规则模拟：20 题中至少答对 14 题，交通标志题至少答对 2 题。",
      },
      {
        question: "模拟考试会显示正确答案吗？",
        answer: "考试过程中不显示正确答案，提交后会显示结果和答题详情，方便复盘。",
      },
      {
        question: "模拟考试结果会保存吗？",
        answer: "考试结果会保存在本机浏览器中，用于本地复习参考；OpenAA 不代表 DMV 官方评分。",
      },
    ],
  },
  "sign-test": {
    name: "纽约 DMV 交通标志专项练习",
    description: "纽约 DMV 中文交通标志专项练习，从题库中筛选标志题并即时反馈。",
    path: "/dmv/sign-test",
    faq: [
      {
        question: "交通标志题为什么要单独练？",
        answer: "纽约 Permit 笔试中交通标志题有单独通过要求，提前熟悉标志含义能减少正式考试中的失误。",
      },
      {
        question: "交通标志专项会加入错题本吗？",
        answer: "会。专项练习中答错的题会加入本机错题本，答对后会从错题本移除。",
      },
      {
        question: "这里的标志题和正式考试完全一样吗？",
        answer: "本页是 OpenAA 整理的中文学习辅助内容，正式题目和要求请以 New York DMV 官方系统为准。",
      },
    ],
  },
  tickets: {
    name: "纽约罚单查询指南",
    description: "纽约停车罚单、红灯摄像头、超速摄像头、交通罚单和过路费官方入口导航。",
    path: "/dmv/tickets",
    faq: [
      {
        question: "纽约停车罚单怎么查询？",
        answer: "纽约市停车罚单可通过 NYC Finance CityPay 查询，支持按罚单号或车牌号查找与缴费。",
      },
      {
        question: "红灯或超速摄像头罚单在哪里查？",
        answer: "纽约市红灯与超速摄像头罚单也可在 NYC Finance CityPay 入口查询和处理，进入后按提示选择对应票种。",
      },
      {
        question: "交通违规 Moving Violation 应该去哪里处理？",
        answer: "涉及交通违规的出庭类罚单通常通过 NY DMV TVB 系统处理，具体以罚单上的法院或 TVB 指引为准。",
      },
      {
        question: "OpenAA 会查询或保存罚单数据吗？",
        answer: "不会。OpenAA 不直接查询罚单，也不保存车牌信息，只提供官方入口导航和中文说明。",
      },
    ],
  },
};

function faqJsonLd(config: DmvPageStructuredData) {
  if (config.faq.length === 0) return null;

  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl(config.path)}#faq`,
    mainEntity: config.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function buildDmvJsonLd(config: DmvPageStructuredData) {
  const url = canonicalUrl(config.path);
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: config.name,
      description: config.description,
      inLanguage: "zh-CN",
      isPartOf: {
        "@type": "WebSite",
        "@id": canonicalUrl("/#website"),
        name: siteConfig.name,
        url: canonicalUrl("/"),
      },
      publisher: {
        "@type": "Organization",
        "@id": canonicalUrl("/#organization"),
        name: siteConfig.name,
        url: canonicalUrl("/"),
      },
      about: [
        { "@type": "Thing", name: "New York DMV" },
        { "@type": "Thing", name: "Learner Permit" },
        { "@type": "Thing", name: "纽约驾照" },
      ],
      mainEntity: config.faq.length > 0 ? { "@id": `${url}#faq` } : undefined,
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: canonicalUrl("/") },
        { "@type": "ListItem", position: 2, name: "DMV", item: canonicalUrl("/dmv") },
        ...(config.path === "/dmv" ? [] : [{ "@type": "ListItem", position: 3, name: config.name, item: url }]),
      ],
    },
    faqJsonLd(config),
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function DmvStructuredData({ page }: { page: DmvStructuredDataPage }) {
  const config = dmvPages[page];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(buildDmvJsonLd(config)) }} />;
}
