import Link from "next/link";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput, AdminTextarea } from "@/components/admin/AdminActionForm";
import { contactUserFromMessages, handleMessageReport, markFeedbackViewed, softDeleteFeedback, softDeleteMessageReport } from "@/features/messages/adminActions";
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

export function AdminMessageTabs({ active }: { active: MessageTab }) {
  const tabs: Array<{ value: MessageTab; label: string; href: string }> = [
    { value: "reports", label: "举报", href: "/admin/messages?tab=reports" },
    { value: "feedback", label: "线索与建议", href: "/admin/messages?tab=feedback" },
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
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ReportsPanel({ data }: { data: AdminMessagesData["reports"] }) {
  return (
    <div className="space-y-4">
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isOpen ? "bg-amber-50 text-amber-700" : report.status === "deleted" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {isOpen ? "未处理" : report.status === "deleted" ? "已删除" : "已处理"}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{report.reasonLabel}</span>
            <details className="inline-block">
              <summary className="cursor-pointer rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">查看举报内容</summary>
              <div className="mt-2 max-w-xl rounded-xl bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                <p className="whitespace-pre-wrap">{report.detail || "未填写详细说明。"}</p>
                <p className="mt-2 break-all text-xs font-semibold text-slate-500">联系方式：{report.contactInfo || report.reporter?.email || "未填写"}</p>
                {report.reporter ? <UserDetails user={report.reporter} /> : null}
              </div>
            </details>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-600">{report.postTypeLabel} · {report.postStatusLabel}</p>
          <h3 className="mt-1 line-clamp-2 font-black text-slate-950">{report.postTitle}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={report.postHref} className="inline-flex min-h-9 items-center rounded-xl bg-white px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-slate-200">查看</Link>
          {report.status === "resolved" ? <DeleteReportButton id={report.id} /> : null}
        </div>
      </div>

      {isOpen ? (
        <details className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <summary className="cursor-pointer text-sm font-black text-slate-900">处理</summary>
          <AdminActionForm action={handleMessageReport} submitLabel="确定处理" className="mt-3 space-y-3">
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
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-black text-slate-900">查看内容</summary>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-slate-700">{item.content}</p>
          </details>
          <p className="mt-2 text-xs font-semibold text-slate-500">编号：{item.ticketNo} · {formatDateTime(item.createdAt)}</p>
          {item.relatedUrl ? <p className="mt-1 break-all text-xs font-semibold text-blue-700">相关链接：{item.relatedUrl}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status === "new" ? (
            <>
              <AdminActionForm action={markFeedbackViewed} submitLabel="已查看" className="contents">
                <input type="hidden" name="id" value={item.id} />
              </AdminActionForm>
              <AdminActionForm action={softDeleteFeedback} submitLabel="查看并删除" className="contents" submitClassName="inline-flex min-h-9 items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
                <input type="hidden" name="id" value={item.id} />
              </AdminActionForm>
            </>
          ) : item.status === "viewed" ? (
            <AdminActionForm action={softDeleteFeedback} submitLabel="删除" className="contents" submitClassName="inline-flex min-h-9 items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
              <input type="hidden" name="id" value={item.id} />
            </AdminActionForm>
          ) : null}
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
      <div className="mt-3 flex flex-wrap gap-2">
        <UserDetails user={user} />
        <details className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <summary className="cursor-pointer text-sm font-black text-blue-700">联系用户</summary>
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
    <AdminActionForm action={softDeleteMessageReport} submitLabel="删除" className="contents" submitClassName="inline-flex min-h-9 items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
      <input type="hidden" name="id" value={id} />
    </AdminActionForm>
  );
}

function UserDetails({ user }: { user: AdminUserSummary }) {
  return (
    <details className="inline-block">
      <summary className="cursor-pointer rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-slate-200">查看用户</summary>
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
