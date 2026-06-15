import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminDetailLayout, AdminDetailSection } from "@/components/admin/AdminDetailLayout";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPostManageDialog } from "@/components/posts/AdminPostManageDialog";
import { getAdminPostDetail, getAdminPostNotificationTemplates, type AdminPostDetail, type AdminPostNotificationTemplate, type AdminPostsPermissions } from "@/features/posts/adminQueries";
import type { PostStatus } from "@/features/posts/types";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "用户发布信息详情",
  description: "OpenAA 后台用户发布信息详情。",
  path: "/admin/user-posts",
  noIndex: true,
});

export default function AdminUserPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminAuthGate>
      {async () => {
        const { id } = await params;
        if (!(await hasAdminModule("user-posts"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminDetailLayout
                back={<AdminActionButton href="/admin/dashboard">返回后台首页</AdminActionButton>}
                title="用户发布信息详情"
                description="当前管理员没有用户发布信息管理模块权限。"
                badges={<AdminPermissionBadge allowed={false} label="user-posts" />}
              >
                <AdminDetailSection title="无权限">
                  <p className="text-sm font-semibold text-slate-500">请联系超级管理员调整功能授权。</p>
                </AdminDetailSection>
              </AdminDetailLayout>
            </div>
          );
        }
        const data = await getAdminPostDetail(id);

        if (!data.canRead) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminDetailLayout
                back={<AdminActionButton href="/admin/user-posts">返回用户发布信息管理</AdminActionButton>}
                title="用户发布信息详情"
                description="当前管理员没有 view_posts 或 moderate_posts 权限。"
                badges={<AdminPermissionBadge allowed={false} label="view_posts / moderate_posts" />}
              >
                <AdminDetailSection title="无权限">
                  <p className="text-sm font-semibold text-slate-500">请联系超级管理员调整后台权限。</p>
                </AdminDetailSection>
              </AdminDetailLayout>
            </div>
          );
        }

        if (!data.post) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminDetailLayout
                back={<AdminActionButton href="/admin/user-posts">返回用户发布信息管理</AdminActionButton>}
                title="用户发布信息详情"
                description={data.error ?? "该内容不存在，或当前已进入回收站。"}
                badges={<AdminPermissionBadge allowed label="view_posts / moderate_posts" />}
              >
                <AdminDetailSection title="无法查看">
                  <p className="text-sm font-semibold text-slate-500">deleted 内容仍请在“回收站 → 用户发布信息”中查看。</p>
                </AdminDetailSection>
              </AdminDetailLayout>
            </div>
          );
        }

        const templates = data.permissions.moderatePosts ? await getAdminPostNotificationTemplates() : [];

        return <AdminUserPostDetail post={data.post} permissions={data.permissions} templates={templates} />;
      }}
    </AdminAuthGate>
  );
}

function AdminUserPostDetail({ post, permissions, templates }: { post: AdminPostDetail; permissions: AdminPostsPermissions; templates: AdminPostNotificationTemplate[] }) {
  return (
    <div className="space-y-4">
      <AdminTopActions />
      <AdminDetailLayout
        back={<AdminActionButton href="/admin/user-posts">返回用户发布信息管理</AdminActionButton>}
        title={post.title}
        description="后台专用详情页，可查看非回收站状态的用户发布信息。"
        badges={
          <>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{post.typeLabel}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{adminPostStatusLabel(post.status)}</span>
          </>
        }
        meta={[
          { label: "类型", value: post.typeLabel },
          { label: "当前状态", value: adminPostStatusLabel(post.status) },
          { label: "作者", value: post.authorLabel },
          { label: "地区", value: post.locationLabel },
          { label: "发布时间", value: formatDateTime(post.publishedAt ?? post.createdAt) },
          { label: "更新时间", value: formatDateTime(post.updatedAt) },
          { label: "浏览数", value: String(post.viewCount) },
          { label: "图片数量", value: String(post.imageCount) },
          { label: "收藏数", value: String(post.favoriteCount) },
          { label: "举报数", value: String(post.reportCount) },
          { label: "ID", value: post.id },
        ]}
        footer={
          <>
            <AdminActionButton href={frontPostHref(post)} variant="neutral">查看前台真实效果</AdminActionButton>
            {permissions.moderatePosts ? <AdminPostManageDialog key={`${post.id}-${post.status}`} post={post} templates={templates} /> : null}
            <AdminActionButton href={`/admin/user-posts?q=${encodeURIComponent(post.id)}`} variant="primary">返回列表管理</AdminActionButton>
          </>
        }
      >
        <AdminDetailSection title="正文">
          {post.summary ? <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{post.summary}</p> : null}
          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{post.body || "暂无正文。"}</div>
        </AdminDetailSection>

        <AdminDetailSection title="图片">
          {post.images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {post.images.map((image) => (
                <figure key={image.url} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.caption || post.title} className="aspect-[4/3] w-full object-cover" />
                  {image.caption ? <figcaption className="px-3 py-2 text-xs font-semibold text-slate-500">{image.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">暂无图片。</p>
          )}
        </AdminDetailSection>

        <AdminDetailSection title="联系方式">
          {!post.canViewContact ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">当前管理员没有 view_post_contacts 或 moderate_posts 权限。</p>
          ) : post.contact ? (
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <MetaItem label="联系人" value={post.contact.contact_name || "未填写"} />
              <MetaItem label="电话" value={post.contact.phone || "未填写"} />
              <MetaItem label="微信" value={post.contact.wechat || "未填写"} />
              <MetaItem label="WhatsApp" value={post.contact.whatsapp || "未填写"} />
              <MetaItem label="邮箱" value={post.contact.email || "未填写"} />
              <MetaItem label="偏好联系方式" value={post.contact.preferred_contact_method || "未填写"} />
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">暂无联系方式。</p>
          )}
        </AdminDetailSection>

        <AdminDetailSection title="管理信息">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <MetaItem label="管理员处理状态" value={post.lastAdminAction ? adminActionLabel(post.lastAdminAction, post.lastAdminActionTemplateKey, post.lastAdminActionReason) : "暂无"} />
            <MetaItem label="处理时间" value={formatDateTime(post.lastAdminActionAt)} />
            <MetaItem label="处理人" value={post.lastAdminActionBy || "未记录"} />
            <MetaItem label="模板" value={post.lastAdminActionTemplateKey || "未使用模板"} />
          </div>
        </AdminDetailSection>

        <AdminDetailSection title="操作记录">
          {post.events.length > 0 ? (
            <div className="space-y-3">
              {post.events.map((event) => (
                <div key={event.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-slate-950">{adminActionLabel(event.eventType, event.templateKey, event.title)}</span>
                    <span className="text-xs font-semibold text-slate-500">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                    <span>状态：{event.statusBefore || "未记录"} → {event.statusAfter || "未记录"}</span>
                    <span>处理人：{event.actorId || "未记录"}</span>
                    <span>模板：{event.templateKey || "未使用模板"}</span>
                  </div>
                  {event.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{event.body}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">暂无管理员处理记录。</p>
          )}
        </AdminDetailSection>
      </AdminDetailLayout>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-1 block break-words font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function frontPostHref(post: AdminPostDetail) {
  const params = new URLSearchParams({ adminReturn: "/admin/user-posts" });
  return `${post.href}?${params.toString()}`;
}

function adminPostStatusLabel(status: PostStatus) {
  if (status === "published") return "显示中";
  if (status === "hidden") return "已下架";
  if (status === "pending_review") return "待审核";
  if (status === "rejected") return "已拒绝";
  if (status === "draft") return "未公开显示";
  if (status === "expired") return "已过期";
  return "已删除";
}

function adminActionLabel(action: string, templateKey?: string | null, reason?: string | null) {
  if (reason) return reason;
  if (templateKey) return templateLabel(templateKey);
  if (action === "hide_post") return "已下架";
  if (action === "approve_post") return "审核通过";
  if (action === "publish_post") return "恢复显示";
  if (action === "reject_post") return "审核拒绝";
  if (action === "delete_post") return "删除到回收站";
  if (action === "mark_post_pending_review") return "标记待审核";
  if (action === "notify_author") return "通知作者";
  return action;
}

function templateLabel(key: string) {
  if (key === "admin_post_hidden") return "已下架";
  if (key === "admin_post_rejected") return "审核拒绝";
  if (key === "content_issue") return "内容需要修改";
  if (key === "image_issue") return "图片需要修改";
  if (key === "contact_issue") return "联系方式需要修改";
  if (key === "missing_info") return "信息需要补充";
  if (key === "wrong_category") return "分类需要修改";
  if (key === "duplicate_post") return "重复发布提醒";
  return key;
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
