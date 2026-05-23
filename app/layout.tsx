import "./globals.css";

export const metadata = {
  title: "ASA.VIP",
  description: "一站式美国生活搜索",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
