import Link from "next/link";
import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { permanentlyDeleteNavigationLink, restoreNavigationLink } from "@/features/navigation/actions";
import { getDeletedNavigationLinkDetail } from "@/features/navigation/queries";
import type { NavigationLink } from "@/features/navigation/types";
import { RecycleBinRestoreNotifyForm } from "@/components/posts/RecycleBinRestoreNotifyForm";
import { permanentlyDeletePost, restoreDeletedPost } from "@/features/posts/adminActions";
import { getRecycleBinPostDetail, type RecycleBinPostDetail } from "@/features/posts/adminQueries";
import { hasAdminModule, isSuperAdmin } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "回收站详情",
  description: "OpenAA 后台统一回收站内容查看。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

type DetailResourceType = "post" | "news" | "navigation";

export default function AdminRecycleBinDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  return (
    <AdminAuthGate>
      {async () => {
        const { type, id } = await params;
        const resourceType = normalizeResourceType(type);
        const superAdmin = await isSuperAdmin();
        const canReadRecycleBin = await hasAdminModule("recycle-bin");

        if (!canReadRecycleBin) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="回收站详情" description="当前管理员没有回收站模块权限。">
                <AdminPermissionBadge allowed={false} label="recycle-bin" />
              </AdminPageHeader>
            </div>
          );
        }

        if (!resourceType) {
          return <MissingDetail message="不支持的回收站资源类型。" returnHref="/admin/recycle-bin" />;
        }

        if (resourceType === "navigation") {
          const data = await getDeletedNavigationLinkDetail(id);
          if (!data.link) return <MissingDetail message={data.error ?? "该公共导航不存在，或当前不在回收站中。"} returnHref="/admin/recycle-bin?tab=navigation" />;
          return <NavigationRecycleBinDetail link={data.link} superAdmin={superAdmin} />;
        }

        const data = await getRecycleBinPostDetail(id);
        if (!data.post || data.post.contentType !== resourceType) {
          return <MissingDetail message={data.error ?? "该内容不存在，或当前不在对应回收站中。"} returnHref={`/admin/recycle-bin?tab=${resourceType}`} />;
        }

        return <ContentRecycleBinDetail item={data.post} resourceType={resourceType} superAdmin={superAdmin} />;
      }}
    </AdminAuthGate>
  );
}

function MissingDetail({ message, returnHref }: { message: string; returnHref: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
      <AdminTopActions />
      </div>
      <AdminPageHeader title="回收站详情" description={message}>
        <AdminPermissionBadge allowed label="super_admin" />
      </AdminPageHeader>
      <Link href={returnHref} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        返回回收站
      </Link>
    </div>
  );
}

function ContentRecycleBinDetail({ item, resourceType, superAdmin }: { item: RecycleBinPostDetail; resourceType: "post" | "news"; superAdmin: boolean }) {
  const returnHref = `/admin/recycle-bin?tab=${resourceType}`;

  return (
    <div className="space-y-4">
      <DetailNavigation returnHref={returnHref} />

      <AdminPageHeader title={item.title} description="后台专用回收站查看页，可查看已删除内容。">
        <AdminPermissionBadge allowed label="recycle-bin" />
        <AdminPermissionBadge allowed={superAdmin} label="super_admin" />
      </AdminPageHeader>

      <AdminCard title="删除信息">
        <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
          <MetaItem label="标题" value={item.title} />
          <MetaItem label="类型" value={item.typeLabel} />
          <MetaItem label="状态" value={item.status} />
          <MetaItem label="删除时间" value={formatDateTime(item.deletedAt)} />
          <MetaItem label="删除来源" value={sourceLabel(item.deletedSource)} />
          <MetaItem label="图片数量" value={String(item.imageCount)} />
          {item.imageError || item.imageErrorAt ? <MetaItem label="图片异常" value={[item.imageError, formatDateTime(item.imageErrorAt)].filter(Boolean).join(" / ")} /> : null}
          <MetaItem label="ID" value={item.id} />
        </div>
      </AdminCard>

      {item.images.length > 0 ? (
        <AdminCard title="图片">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {item.images.map((image) => (
              <figure key={image.url} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.caption || item.title} className="aspect-[4/3] w-full object-cover" />
                {image.caption ? <figcaption className="px-3 py-2 text-xs font-semibold text-slate-500">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="正文/描述">
        {item.summary ? <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{item.summary}</p> : null}
        <div className="whitespace-pre-wrap rounded-xl bg-white text-sm leading-7 text-slate-800">{item.body || "暂无正文。"}</div>
      </AdminCard>

      <AdminCard title="联系方式">
        {item.contact ? (
          <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
            <MetaItem label="联系人" value={item.contact.contact_name || "未填写"} />
            <MetaItem label="电话" value={item.contact.phone || "未填写"} />
            <MetaItem label="微信" value={item.contact.wechat || "未填写"} />
            <MetaItem label="邮箱" value={item.contact.email || "未填写"} />
            <MetaItem label="优先联系方式" value={item.contact.preferred_contact_method || "未填写"} />
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">暂无联系方式。</p>
        )}
      </AdminCard>

      <AdminCard title="操作">
        <div className="flex flex-wrap items-start gap-3">
          {superAdmin && resourceType === "post" ? (
            <RecycleBinRestoreNotifyForm id={item.id} resourceType={resourceType} title={item.title} />
          ) : superAdmin ? (
            <AdminActionForm action={restoreDeletedPost} submitLabel="恢复" className="contents" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="resource_type" value={resourceType} />
              <input type="hidden" name="content_type" value={resourceType} />
            </AdminActionForm>
          ) : null}
          {superAdmin ? (
            <AdminActionForm action={permanentlyDeletePost} submitLabel="永久删除" className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="resource_type" value={resourceType} />
              <input type="hidden" name="content_type" value={resourceType} />
              <AdminCheckbox label="永久删除后不可恢复，资料、图片和相关收藏记录都会被删除。" name="confirm_permanent_delete" />
            </AdminActionForm>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">永久删除和恢复操作仅限超级管理员。</p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

function NavigationRecycleBinDetail({ link, superAdmin }: { link: NavigationLink; superAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <DetailNavigation returnHref="/admin/recycle-bin?tab=navigation" />

      <AdminPageHeader title={link.title} description="后台专用公共导航查看页。">
        <AdminPermissionBadge allowed label="recycle-bin" />
        <AdminPermissionBadge allowed={superAdmin} label="super_admin" />
      </AdminPageHeader>

      <AdminCard title="导航信息">
        <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
          <MetaItem label="网站名称" value={link.title} />
          <MetaItem label="网址" value={link.url} />
          <MetaItem label="分类" value={link.categoryName} />
          <MetaItem label="状态" value={link.deletedAt ? "deleted" : "active"} />
          <MetaItem label="删除时间" value={formatDateTime(link.deletedAt)} />
          <MetaItem label="删除人" value={link.deletedBy ?? "未记录"} />
          <MetaItem label="ID" value={link.id} />
        </div>
      </AdminCard>

      <AdminCard title="描述">
        <div className="whitespace-pre-wrap rounded-xl bg-white text-sm leading-7 text-slate-800">{link.description || "暂无描述。"}</div>
      </AdminCard>

      <AdminCard title="操作">
        <div className="flex flex-wrap items-start gap-3">
          {superAdmin ? (
            <>
              <AdminActionForm action={restoreNavigationLink} submitLabel="恢复" className="contents" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <input type="hidden" name="id" value={link.id} />
              </AdminActionForm>
              <AdminActionForm action={permanentlyDeleteNavigationLink} submitLabel="永久删除" className="contents" submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <input type="hidden" name="id" value={link.id} />
              </AdminActionForm>
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">恢复和永久删除操作仅限超级管理员。</p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

function DetailNavigation({ returnHref }: { returnHref: string }) {
  return (
    <div className="space-y-2">
      <AdminTopActions />
      <Link href={returnHref} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
        返回回收站
      </Link>
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

function normalizeResourceType(value: string): DetailResourceType | null {
  if (value === "post" || value === "news" || value === "navigation") return value;
  return null;
}
