import { PageShell } from "@/components/layout/PageShell";

type PlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PlaceholderPage({ title, description, eyebrow = "Phase 1" }: PlaceholderPageProps) {
  return (
    <PageShell title={title} description={description} eyebrow={eyebrow}>
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          杩欓噷鏄?openaa.com 绗竴闃舵鍗犱綅椤甸潰銆傚綋鍓嶅彧寤虹珛璺敱銆佺Щ鍔ㄧ甯冨眬銆丼EO/PWA 鍩虹鍜屽悗缁笟鍔℃ā鍧楀叆鍙ｏ紝涓嶆帴鍏ョ湡瀹炰笟鍔℃暟鎹€?
        </p>
      </section>
    </PageShell>
  );
}
