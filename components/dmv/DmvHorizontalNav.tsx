import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";

export const dmvNavItems = [
  { value: "tools", label: "工具中心", href: "/dmv" },
  { value: "questions", label: "中文题库", href: "/dmv/questions" },
  { value: "practice", label: "笔试练习", href: "/dmv/practice" },
  { value: "mock-test", label: "模拟考试", href: "/dmv/mock-test" },
  { value: "wrong-questions", label: "错题练习", href: "/dmv/wrong-questions" },
  { value: "tickets", label: "罚单查询", href: "/dmv/tickets" },
] as const;

type DmvHorizontalNavProps = {
  activeValue: (typeof dmvNavItems)[number]["value"];
};

export function DmvHorizontalNav({ activeValue }: DmvHorizontalNavProps) {
  return <HorizontalPillTabs tabs={dmvNavItems} activeValue={activeValue} ariaLabel="DMV 页面导航" />;
}
