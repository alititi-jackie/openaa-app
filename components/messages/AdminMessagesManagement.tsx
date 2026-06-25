import Link from "next/link";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput, AdminTextarea } from "@/components/admin/AdminActionForm";
import { contactUserFromMessages, handleMessageReport, markFeedbackViewed, softDeleteFeedback, softDeleteMessageReport, updateReportLimitSettings } from "@/features/messages/adminActions";
import type { AdminFeedbackItem, AdminMessageReport, AdminMessagesData, AdminUserSummary, FeedbackStatusTab, MessageTab, ReportStatusTab } from "@/features/messages/adminQueries";
import { reportReasonOptions } from "@/features/reports/types";
import { supportTicketTypeOptions } from "@/features/support/types";

const reportTabs: Array<{ value: ReportStatusTab; label: string }> = [
  { value: "open", label: "未处理" },
  { value: "resolved", label: "已处理" },
  { value: "deleted", label: "已删除" },
];

const feedbackTabs: Array<{ value: FeedbackStatusTab; label: string }> = [
  { value: "new", label: "未查看" },
  { value: "viewed", label: "已查看" },
  { value: "deleted", label: "已删除" },
];

const secondaryActionClassName = "inline-flex min-h-9 items-center justify-center rounded-xl bg-white px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-slate-200";
const dangerActionClassName = "inline-flex min-h-9 items-center justify-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white";
const contactCardActionClassName = "inline-flex min-h-10 w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-black";

export function AdminMessageTabs({ active, counts }: { active: MessageTab; counts?: { reports: number; feedback: number } }) {
  const tabs: Array<{ value: MessageTab; label: string; href: string; count?: number }> = [
    { value: "reports", label: "举报", href: "/admin/messages?tab=reports", count: counts?.reports ?? 0 },
    { value: "feedback", label: "线索与建议", href: "/admin/messages?tab=feedback", count: counts?.feedback ?? 0 },
    { value: "contact-users", label: "联系用户", href: "/admin/messages?tab=contact-users" },
  ];
  return (
    <nav className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
              active === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? <PendingTabCount value={tab.count} activeTab={active === tab.value} /> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function PendingTabCount({ value, activeTab }: { value: number; activeTab: boolean }) {
  const hasItems = value > 0;
  return (
    <span className={`ml-2 text-[15px] font-black leading-none ${hasItems ? "text-red-600" : activeTab ? "text-white/80" : "text-slate-500"}`}>
      {value}
    </span>
  );
}

export function ReportsPanel({ data }: { data: AdminMessagesData["reports"] }) {
  return (
    <div className="space-y-4">
      <ReportLimitSettingsPanel settings={data.settings} />
      <StatusTabs
        baseHref="/admin/messages?tab=reports"
        active={data.activeStatus}
        tabs={reportTabs.map((tab) => ({ ...tab, count: data.totals[tab.value] }))}
        paramName="reportStatus"
      />
      {data.items.length === 0 ? (
        <EmptyLine text="暂无举报记录。" />
      ) : (
        <div className="space-y-3">
          {data.items.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportLimitSettingsPanel({ settings }: { settings: AdminMessagesData["reports"]["settings"] }) {
  return (
    <details className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-black text-slate-900">举报限制设置</summary>
      <AdminActionForm action={updateReportLimitSettings} submitLabel="保存举报限制" className="mt-3 space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <AdminTextInput label="登录用户每天" name="report_daily_user_limit" type="number" defaultValue={settings.userDailyLimit} required />
          <AdminTextInput label="匿名访客每天" name="report_daily_visitor_limit" type="number" defaultValue={settings.visitorDailyLimit} required />
          <AdminTextInput label="同一 IP 每天" name="report_daily_ip_limit" type="number" defaultValue={settings.ipDailyLimit} required />
          <AdminTextInput label="全站每天总量" name="report_daily_total_limit" type="number" defaultValue={settings.totalDailyLimit} required />
        </div>
        <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500">
          数量范围 1~1000。单个登录用户、匿名访客和 IP 的每日上限不能大于全站每日总量。
        </p>
      </AdminActionForm>
    </details>
  );
}

export function FeedbackPanel({ data }: { data: AdminMessagesData["feedback"] }) {
  return (
    <div className="space-y-4">
      <form action="/admin/messages" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input type="hidden" name="tab" value="feedback" />
        <input type="hidden" name="feedbackStatus" value={data.activeStatus} />
        <select name="feedbackType" defaultValue={data.activeType} className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
          <option value="all">全部反馈类型</option>
          {supportTicketTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">筛选</button>
      </form>
      <StatusTabs
        baseHref={`/admin/messages?tab=feedback${data.activeType !== "all" ? `&feedbackType=${data.activeType}` : ""}`}
        active={data.activeStatus}
        tabs={feedbackTabs.map((tab) => ({ ...tab, count: data.totals[tab.value] }))}
        paramName="feedbackStatus"
      />
      {data.items.length === 0 ? (
        <EmptyLine text="暂无线索与建议。" />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactUsersPanel({ data }: { data: AdminMessagesData["contactUsers"] }) {
  return (
    <div className="space-y-4">
      <form action="/admin/messages" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input type="hidden" name="tab" value="contact-users" />
        <input name="q" defaultValue={data.q} placeholder="搜索用户名、登录邮箱或本站 ID" className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
        <button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">搜索</button>
      </form>
      {data.q.trim().length > 0 && data.q.trim().length < 2 ? <EmptyLine text="请输入至少 2 个字符。" /> : null}
      {data.users.length === 0 && data.q.trim().length >= 2 ? <EmptyLine text="没有找到匹配用户。" /> : null}
      {data.users.length > 0 ? <p className="text-sm font-black text-slate-700">{data.mode === "search" ? "搜索结果" : "已注册用户"}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data.users.map((user) => (
          <UserContactCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: AdminMessageReport }) {
  const isOpen = report.status === "open";
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isOpen ? "bg-amber-50 text-amber-700" : report.status === "deleted" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {isOpen ? "未处理" : report.status === "deleted" ? "已删除" : "已处理"}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{report.reasonLabel}</span>
          {report.postAction ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">处理结果：{reportActionLabel(report.postAction)}</span> : null}
        </div>
        <p className="mt-2 text-sm font-bold text-slate-600">{report.postTypeLabel} · {report.postStatusLabel}</p>
        <h3 className="mt-1 line-clamp-2 font-black text-slate-950">{report.postTitle}</h3>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
        <details className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <summary className="cursor-pointer text-sm font-black text-blue-700">查看举报内容</summary>
          <div className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
            <p className="whitespace-pre-wrap">{report.detail || "未填写详细说明。"}</p>
            <p className="mt-2 break-all text-xs font-semibold text-slate-500">联系方式：{report.contactInfo || report.reporter?.email || "未填写"}</p>
            {report.reporter ? <UserDetails user={report.reporter} /> : null}
          </div>
        </details>
        <Link href={report.postHref} className={secondaryActionClassName}>查看信息</Link>
        {isOpen ? (
          <details className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <summary className="cursor-pointer text-sm font-black text-slate-900">处理</summary>
          <AdminActionForm
            action={handleMessageReport}
            submitLabel="确定处理"
            className="mt-3 space-y-3"
            footerStart={<Link href="/admin/messages?tab=reports&reportStatus=open" className={secondaryActionClassName}>取消</Link>}
          >
            <input type="hidden" name="id" value={report.id} />
            <AdminSelect
              label="处理方式"
              name="post_action"
              defaultValue="hide"
              options={[
                { value: "none", label: "不处理" },
                { value: "hide", label: "下架" },
                { value: "delete", label: "删除" },
              ]}
            />
            <AdminCheckbox label="通知作者" name="notify_author" defaultChecked />
            <AdminSelect label="原因" name="admin_reason" defaultValue={report.reason} options={reportReasonOptions()} />
            <AdminTextarea label="通知作者内容（可修改）" name="admin_message_editable" defaultValue={report.defaultAuthorMessage} rows={4} />
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              固定内容会由系统按处理方式自动追加，管理员不可修改。
            </p>
          </AdminActionForm>
          </details>
        ) : null}
        {!isOpen ? <ReportResultDetails report={report} /> : null}
        {report.status === "resolved" ? <DeleteReportButton id={report.id} /> : null}
      </div>
    </article>
  );
}

function FeedbackCard({ item }: { item: AdminFeedbackItem }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{item.typeLabel}</span>
            <span className="break-all rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{item.contactInfo || item.user?.email || "未填写联系方式"}</span>
            {item.user ? <UserDetails user={item.user} /> : null}
          </div>
          <details className="mt-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <summary className="cursor-pointer text-sm font-black text-slate-900">查看内容</summary>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item.content}</p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {item.status === "new" ? (
                <>
                  <AdminActionForm action={markFeedbackViewed} submitLabel="已查看" className="contents">
                    <input type="hidden" name="id" value={item.id} />
                  </AdminActionForm>
                  <AdminActionForm action={softDeleteFeedback} submitLabel="查看并删除" className="contents" submitClassName={dangerActionClassName}>
                    <input type="hidden" name="id" value={item.id} />
                  </AdminActionForm>
                </>
              ) : item.status === "viewed" ? (
                <AdminActionForm action={softDeleteFeedback} submitLabel="删除" className="contents" submitClassName={dangerActionClassName}>
                  <input type="hidden" name="id" value={item.id} />
                </AdminActionForm>
              ) : null}
            </div>
          </details>
          <p className="mt-2 text-xs font-semibold text-slate-500">编号：{item.ticketNo} · {formatDateTime(item.createdAt)}</p>
          {item.relatedUrl ? <p className="mt-1 break-all text-xs font-semibold text-blue-700">相关链接：{item.relatedUrl}</p> : null}
        </div>
      </div>
    </article>
  );
}

function UserContactCard({ user }: { user: AdminUserSummary }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <h3 className="font-black text-slate-950">{user.nickname || "未设置用户名"}</h3>
      <p className="mt-1 break-all text-sm font-semibold text-slate-600">邮箱：{user.email || "未填写"}</p>
      <p className="mt-1 break-all text-xs font-semibold text-slate-500">ID：{user.id}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <UserDetails user={user} variant="cardAction" />
        <details className="min-w-0 open:col-span-2">
          <summary className={`${contactCardActionClassName} cursor-pointer bg-slate-950 text-white`}>联系用户</summary>
          <AdminActionForm action={contactUserFromMessages} submitLabel="发送" className="mt-3 space-y-3">
            <input type="hidden" name="user_id" value={user.id} />
            <AdminTextInput label="标题" name="title" defaultValue="OpenAA 管理员联系你" required />
            <AdminTextarea label="内容" name="body" rows={5} />
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              系统会自动追加：如需联系管理员，请在“我的”页面的线索与建议中选择“回复管理员”。
            </p>
          </AdminActionForm>
        </details>
      </div>
    </article>
  );
}

function DeleteReportButton({ id }: { id: string }) {
  return (
    <AdminActionForm action={softDeleteMessageReport} submitLabel="删除" className="contents" submitClassName={dangerActionClassName}>
      <input type="hidden" name="id" value={id} />
    </AdminActionForm>
  );
}

function ReportResultDetails({ report }: { report: AdminMessageReport }) {
  return (
    <details className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
      <summary className="cursor-pointer text-sm font-black text-slate-900">查看处理结果</summary>
      <div className="mt-2 grid gap-2 text-xs font-semibold leading-5 text-slate-600">
        <span>处理方式：{report.postAction ? reportActionLabel(report.postAction) : "未记录"}</span>
        <span>处理原因：{report.adminReasonLabel || "未记录"}</span>
        <span>是否通知作者：{report.notifyAuthor ? "是" : "否"}</span>
        <span>处理管理员：{report.handler ? userLabel(report.handler) : "未记录"}</span>
        <span>处理时间：{report.resolvedAt ? formatDateTime(report.resolvedAt) : "未记录"}</span>
        {report.adminMessageEditable ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-black text-slate-700">通知作者内容</p>
            <p className="mt-1 whitespace-pre-wrap">{report.adminMessageEditable}</p>
          </div>
        ) : null}
        {report.adminMessageFixed ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-black text-slate-700">固定处理内容</p>
            <p className="mt-1 whitespace-pre-wrap">{report.adminMessageFixed}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function UserDetails({ user, variant = "chip" }: { user: AdminUserSummary; variant?: "chip" | "cardAction" }) {
  const isCardAction = variant === "cardAction";
  return (
    <details className={isCardAction ? "min-w-0 open:col-span-2" : "inline-block"}>
      <summary
        className={
          isCardAction
            ? `${contactCardActionClassName} cursor-pointer bg-white text-blue-700 ring-1 ring-slate-200`
            : "cursor-pointer rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-slate-200"
        }
      >
        查看用户
      </summary>
      <div className="mt-2 grid min-w-72 gap-1 rounded-xl bg-white p-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100">
        <span>用户名：{user.nickname || "未设置"}</span>
        <span className="break-all">ID：{user.id}</span>
        <span className="break-all">邮箱：{user.email || "未填写"}</span>
        <span>电话：{user.phone || "未填写"}</span>
        <span>微信：{user.wechatId || "未填写"}</span>
        <span>WhatsApp：{user.whatsapp || "未填写"}</span>
        <span>状态：{user.status || "未知"}</span>
      </div>
    </details>
  );
}

function StatusTabs<T extends string>({
  baseHref,
  active,
  tabs,
  paramName,
}: {
  baseHref: string;
  active: T;
  tabs: Array<{ value: T; label: string; count: number }>;
  paramName: string;
}) {
  return (
    <nav className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-2">
        {tabs.map((tab) => {
          const href = `${baseHref}&${paramName}=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
                active === tab.value ? "bg-blue-50 text-blue-800 ring-blue-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label} <span className="ml-1 text-xs opacity-70">{tab.count}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">{text}</p>;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { hour12: false });
}

function reportActionLabel(value: AdminMessageReport["postAction"]) {
  if (value === "none") return "不处理";
  if (value === "hide") return "下架";
  if (value === "delete") return "删除";
  return "未记录";
}

function userLabel(user: AdminUserSummary) {
  return user.nickname || user.email || user.id;
}
