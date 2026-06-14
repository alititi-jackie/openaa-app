import Link from "next/link";
import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { permanentlyDeletePost, restoreDeletedPost } from "@/features/posts/adminActions";
import { getRecycleBinPostDetail, type RecycleBinPostDetail } from "@/features/posts/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "回收站详情",
  description: "OpenAA 后台回收站内容查看。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

export default function AdminRecycleBinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminAuthGate>
      {async () => {
        const { id } = await params;
        const data = await getRecycleBinPostDetail(id);

        if (!data.superAdmin) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="回收站详情" description="只有超级管理员可以访问删除管理">
                <AdminPermissionBadge allowed={false} label="super_admin" />
              </AdminPageHeader>
            </div>
          );
        }

        if (!data.post) {
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <AdminBackNavigation />
                <AdminLogoutButton />
              </div>
              <AdminPageHeader title="回收站详情" description={data.error ?? "该内容不存在，或当前不是 deleted 状态。"}>
                <AdminPermissionBadge allowed={data.superAdmin} label="super_admin" />
              </AdminPageHeader>
              <Link href="/admin/recycle-bin" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                返回回收站
              </Link>
            </div>
          );
        }

        return <RecycleBinDetail post={data.post} />;
      }}
    </AdminAuthGate>
  );
}

function RecycleBinDetail({ post }: { post: RecycleBinPostDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AdminBackNavigation />
        <Link href="/admin/recycle-bin" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
          返回回收站
        </Link>
        <AdminLogoutButton />
      </div>

      <AdminPageHeader title={post.title} description="后台专用回收站查看页，可查看已删除内容。">
        <AdminPermissionBadge allowed label="super_admin" />
      </AdminPageHeader>

      <AdminCard title="删除信息">
        <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
          <MetaItem label="标题" value={post.title} />
          <MetaItem label="类型" value={post.typeLabel} />
          <MetaItem label="状态" value={post.status} />
          <MetaItem label="删除时间" value={formatDateTime(post.deletedAt)} />
          <MetaItem label="删除来源" value={sourceLabel(post.deletedSource)} />
          <MetaItem label="图片数量" value={String(post.imageCount)} />
          {post.imageError || post.imageErrorAt ? <MetaItem label="图片异常" value={[post.imageError, formatDateTime(post.imageErrorAt)].filter(Boolean).join(" / ")} /> : null}
          <MetaItem label="ID" value={post.id} />
        </div>
      </AdminCard>

      {post.images.length > 0 ? (
        <AdminCard title="图片">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {post.images.map((image) => (
              <figure key={image.url} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.caption || post.title} className="aspect-[4/3] w-full object-cover" />
                {image.caption ? <figcaption className="px-3 py-2 text-xs font-semibold text-slate-500">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="正文/描述">
        {post.summary ? <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{post.summary}</p> : null}
        <div className="whitespace-pre-wrap rounded-xl bg-white text-sm leading-7 text-slate-800">{post.body || "暂无正文。"}</div>
      </AdminCard>

      <AdminCard title="联系方式">
        {post.contact ? (
          <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
            <MetaItem label="联系人" value={post.contact.contact_name || "未填写"} />
            <MetaItem label="电话" value={post.contact.phone || "未填写"} />
            <MetaItem label="微信" value={post.contact.wechat || "未填写"} />
            <MetaItem label="邮箱" value={post.contact.email || "未填写"} />
            <MetaItem label="优先联系方式" value={post.contact.preferred_contact_method || "未填写"} />
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">暂无联系方式。</p>
        )}
      </AdminCard>

      <AdminCard title="操作">
        <div className="flex flex-wrap items-start gap-3">
          <AdminActionForm action={restoreDeletedPost} submitLabel="恢复" className="contents" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            <input type="hidden" name="id" value={post.id} />
          </AdminActionForm>
          <AdminActionForm action={permanentlyDeletePost} submitLabel="永久删除" className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            <input type="hidden" name="id" value={post.id} />
            <AdminCheckbox label="永久删除后不可恢复，资料、图片和相关收藏记录都会被删除。" name="confirm_permanent_delete" />
          </AdminActionForm>
        </div>
      </AdminCard>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-1 block break-words text-slate-950">{value}</span>
    </div>
  );
}

function sourceLabel(source: RecycleBinPostDetail["deletedSource"]) {
  if (source === "user") return "用户删除";
  if (source === "admin") return "管理员删除";
  return "未知来源";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
