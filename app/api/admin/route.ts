import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions/admin";

export async function GET() {
  const admin = await requireAdmin();

  if (admin.status === "missing_config") {
    return NextResponse.json({ status: admin.status }, { status: 503 });
  }

  if (admin.status === "unauthenticated") {
    return NextResponse.json({ status: admin.status }, { status: 401 });
  }

  if (admin.status === "forbidden") {
    return NextResponse.json({ status: admin.status }, { status: 403 });
  }

  return NextResponse.json({
    status: admin.status,
    user: {
      id: admin.user.id,
      email: admin.user.email ?? null,
    },
    adminRole: {
      role: admin.adminRole.role,
      isActive: admin.adminRole.is_active,
    },
  });
}
