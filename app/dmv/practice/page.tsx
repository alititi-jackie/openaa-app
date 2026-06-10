import { DmvPracticeClient } from "@/components/dmv/DmvPracticeClient";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 练习模式",
  description: "纽约 DMV 中文练习，可选择随机或顺序、题数，并在答题后即时查看解释。",
  path: "/dmv/practice",
  noIndex: true,
});

export default async function DmvPracticePage() {
  const bank = await getDmvQuestionBank();

  return (
    <div className="space-y-4">
      <DmvPracticeClient questions={bank.questions} />
      <ChannelSeoCard title="DMV Permit 中文练习与模拟考试说明">
        <div className="space-y-3">
          <p>
            这个页面是 OpenAA 的纽约 DMV Permit 训练入口，围绕 DMV Permit 题库、DMV 中文笔试、模拟考试、交通标志、Learner Permit 等核心主题设计。许多用户会先搜索“Permit 中文练习”或“纽约 DMV 中文笔试”，再进入练习系统，因此底部保留了完整文字说明，让搜索引擎与首次访问者都能快速理解页面用途。
          </p>
          <p>
            适合使用的人群包括准备第一次参加 Learner Permit 笔试的新移民、想用中文复习规则的华人用户、以及需要集中突破交通标志题的考生。你可以根据自己的进度选择随机练习、顺序练习、错题复盘或完整模拟考试。对时间碎片化的上班族来说，通勤前后做一组题、晚上做一次模拟，通常是更稳妥的复习节奏。
          </p>
          <p>
            OpenAA 在这里提供的是“可持续复习”的学习体验：题库持续可查、错题能回看、考试节奏可按个人安排调整。真实场景里，很多法拉盛和皇后区的华人考生会在报名前一到两周每天刷题，把容易混淆的路权题和标志题反复练熟，再去参加正式笔试。这样不仅能提升通过率，也能在后续路考准备阶段更快进入状态。
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
      </ChannelSeoCard>
    </div>
  );
}
