type SeoContentCardProps = {
  title?: string;
  content?: string;
  isVisible?: boolean;
};

export function SeoContentCard({
  title = "OpenAA 纽约华人生活入口",
  content = "OpenAA 面向纽约华人社区，整理招聘、租房、二手市场、本地服务、新闻资讯、DMV 学习和常用导航等入口。第一版先建立移动优先的前台结构，后续再逐步接入真实内容和审核流程。",
  isVisible = true,
}: SeoContentCardProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{content}</p>
    </section>
  );
}
