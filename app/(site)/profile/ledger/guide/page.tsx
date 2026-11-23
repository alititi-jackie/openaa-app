import { BackButton } from "@/components/common/BackButton";
export const metadata = {
  title: "生活收支账本使用说明",
  robots: { index: false, follow: false },
};
export default function Guide() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-4 pb-8">
      <BackButton href="/profile/ledger" label="返回账本" />
      <h1 className="text-2xl font-bold">生活收支账本使用说明</h1>
      {[
        [
          "记一笔",
          "登录后选择开支、收入或汇款。填写开支时选择现金或银行卡，再选分类；备注可留空。汇款可指定由另外两项计算美元、人民币或汇率。保存后可在对应月份的明细中查看。",
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
          "选择 Excel 或旧版 JSON 备份，预览新增、已有及待核对的记录。核对修改和相似记录，再确认导入。从 Excel 删除一行不会删除账号内的账目。",
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
