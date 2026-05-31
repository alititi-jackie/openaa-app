import { NextResponse } from "next/server";
import { getPostContact } from "@/features/posts/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPostContact(id);

  if (result.state === "missing_config") {
    return NextResponse.json({ message: "Supabase 环境变量尚未配置，暂时无法查看联系方式。" }, { status: 503 });
  }

  if (result.state === "error") {
    return NextResponse.json({ message: "联系方式暂不可查看，请稍后再试。" }, { status: 500 });
  }

  if (!result.data) {
    return NextResponse.json({ message: result.error || "暂无可公开查看的联系方式。" }, { status: 404 });
  }

  const hasContact = Boolean(result.data.phone || result.data.wechat || result.data.email || result.data.contact_name);

  return NextResponse.json({
    ...result.data,
    message: hasContact ? undefined : "发布者暂未填写联系方式。",
  });
}
