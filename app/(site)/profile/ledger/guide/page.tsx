import { BackButton } from "@/components/common/BackButton";
import { PageShareButton } from "@/components/common/PageShareButton";
import { detailActionButtonClass } from "@/components/common/detailActionStyles";
export const metadata = {
  title: "生活收支账本使用说明",
  robots: { index: false, follow: false },
};
export default async function Guide({ searchParams }: { searchParams: Promise<{ book?: string }> }) {
  const {book} = await searchParams;
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-4 pb-8">
      <div className="flex items-center justify-between"><BackButton href={book ? "/profile/ledger?book=" + encodeURIComponent(book) : "/profile/ledger"} label="账本首页" className={detailActionButtonClass} /><PageShareButton path="/profile/ledger" title="OpenAA 生活收支账本" text="登录后打开自己的生活账本" /></div>
      <h1 className="text-2xl font-bold">生活收支账本使用说明</h1>
      {[
        [
          "添加到桌面",
          "在账本首页点「添加到桌面」。iPhone 用 Safari 打开账本，点分享，再选添加到主屏幕。点生活账本图标即可进入，登录失效时先登录。保存记录需要联网。",
        ],
        [
          "记一笔",
          "登录后选择开支、收入或汇款。填写开支时选择现金或银行卡，再选分类；备注可留空。汇款时任填美元、汇率、人民币中的两项即可算出第三项，也可手动选择计算哪一项。汇率或金额超出常用范围时，核对后仍可保存。保存后可在对应月份的明细中查看。",
        ],
        [
          "查看与搜索",
          "先选月份、年度或全部，再输入部分备注或金额。例如搜“菜”可找到“买菜”，搜“58”可找到 58.96。查看开支时可左右滑动选择分类，点“全部”恢复。",
        ],
        [
          "填写 Excel",
          "在“导出／分享”下载空白模板，或在已导出的完整账本的明细表末尾追加。每笔一行，新记录的编号留空。",
        ],
        [
          "导入账本",
          "选择账号版 Excel 明细文件，预览新增、已有及待核对的记录。核对修改和相似记录，再确认导入。默认合并时，删除文件中的行不会删除账号记录。覆盖会替换文件包含的账本，空明细表也会覆盖。可撤销上次导入；相关记录已被修改时会提示冲突。",
        ],
        [
          "定期备份",
          "建议每月及批量修改前导出完整 Excel 文件，另存一份并确认能打开。完整导出包含开支、收入和汇款。",
        ],
      ].map(([title, body]) => (
        <section key={title}>
          <h2 className="font-bold">{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </article>
  );
}
