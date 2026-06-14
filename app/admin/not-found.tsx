import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AdminNotFound() {
  return (
    <AdminAuthGate>
      {() => <AdminPageHeader title="后台页面不存在" description="这个后台页面当前不可用，请返回总后台选择已有管理入口。" />}
    </AdminAuthGate>
  );
}
