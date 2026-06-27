import { DmvPracticeClient } from "@/components/dmv/DmvPracticeClient";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { DmvStructuredData } from "@/features/dmv/structuredData";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 练习模式",
  description: "纽约 DMV 中文练习，可选择随机或顺序、题数，并在答题后即时查看解释。",
  path: "/dmv/practice",
});

export default async function DmvPracticePage() {
  const bank = await getDmvQuestionBank();

  return (
    <>
      <DmvStructuredData page="practice" />
      <DmvPracticeClient questions={bank.questions} />
    </>
  );
}
