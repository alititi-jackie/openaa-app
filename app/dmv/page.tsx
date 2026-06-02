import Link from "next/link";
import { BookOpen, CarFront, CircleHelp, ClipboardList, FileQuestion, RotateCcw, TriangleAlert } from "lucide-react";
import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约 DMV 中文学习平台",
  description: "纽约 DMV 中文题库、练习模式、交通标志专项、模拟考试、错题练习和罚单查询入口。",
  path: "/dmv",
});

const dmvEntries = [
  { title: "查看题库", description: "浏览题目、筛选分类、查看答案解析", href: "/dmv/questions", icon: BookOpen },
  { title: "练习模式", description: "随机或顺序刷题，答题后立即看反馈", href: "/dmv/practice", icon: ClipboardList },
  { title: "交通标志", description: "专项练习交通标志题，适合考前快速复习", href: "/dmv/sign-test", icon: TriangleAlert },
  { title: "模拟考试", description: "20 题模拟，按纽约 DMV 规则判分", href: "/dmv/mock-test", icon: CircleHelp },
  { title: "错题练习", description: "复习本机保存的错题记录", href: "/dmv/wrong-questions", icon: RotateCcw },
];

export default function DmvPage() {
  return (
    <ChannelPageChrome
      channelKey="dmv"
      path="/dmv"
      title="纽约 DMV 中文学习平台"
      description="纽约 DMV 中文题库、练习模式、交通标志专项、模拟考试、错题练习和罚单查询入口。"
    >
      <ChannelHero title="纽约 DMV 中文学习平台" description="查看中文题库，随机练习，专项复习交通标志，按纽约 DMV 规则模拟考试，并在本机保存错题记录。" icon={CarFront} />
      <section className="grid grid-cols-2 gap-3">
        {dmvEntries.map((entry) => {
          const Icon = entry.icon;

          return (
            <Link key={entry.href} href={entry.href} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="mt-3 block font-black text-slate-950">{entry.title}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">{entry.description}</span>
            </Link>
          );
        })}
      </section>
      <Link href="/dmv/tickets" className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <FileQuestion size={21} aria-hidden="true" />
        </span>
        <span>
          <span className="block font-black text-slate-950">罚单查询</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">保留纽约交通罚单查询入口，后续继续完善。</span>
        </span>
      </Link>
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="font-black text-slate-950">DMV 题库说明</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          OpenAA 纽约 DMV 中文练习题库仅供学习参考，实际考试内容以 New York DMV 官方资料为准。
        </p>
      </section>
      <ChannelSeoCard title="纽约 DMV 中文练习">
        OpenAA DMV 页面提供中文题库浏览、随机练习、交通标志专项、模拟考试和本机错题练习。题库仅供学习参考，实际考试内容以 New York DMV 官方资料为准。
      </ChannelSeoCard>
    </ChannelPageChrome>
  );
}
