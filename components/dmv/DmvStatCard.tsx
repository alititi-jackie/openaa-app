type DmvStatCardTone = "green" | "red" | "blue" | "slate" | "amber";

type DmvStatCardProps = {
  label: string;
  value: number | string;
  tone: DmvStatCardTone;
  shadow?: boolean;
};

export function DmvStatCard({ label, value, tone, shadow = true }: DmvStatCardProps) {
  const colorClass = {
    green: "border-green-100 bg-green-50 text-green-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    slate: "border-slate-100 bg-white text-slate-600",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${shadow ? "shadow-sm " : ""}${colorClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}
