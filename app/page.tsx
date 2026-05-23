import SearchBox from "@/components/SearchBox";

export default function HomePage() {
  return (
    <main className="home">
      <div className="center-box">
        <div className="logo">ASA.VIP</div>

        <div className="subtitle">
          一站式美国生活搜索
        </div>

        <SearchBox />

        <div className="footer">
          Jobs · Housing · Guides · Google · AI
        </div>
      </div>
    </main>
  );
}
