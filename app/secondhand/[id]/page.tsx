import { redirect } from "next/navigation";

export default async function SecondhandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/marketplace/${id}`);
}
