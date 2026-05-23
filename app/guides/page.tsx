export default function GuidesPage() {
  return (
    <main className="home">
      <div className="center-box">
        <div className="logo" style={{ fontSize: 42 }}>
          Guides
        </div>

        <div
          style={{
            marginTop: 40,
            textAlign: "left",
            lineHeight: 1.8,
          }}
        >
          <h3>DMV Guide</h3>
          <p>纽约驾照申请完整流程。</p>

          <h3>Job Guide</h3>
          <p>美国找工作与工厂工作指南。</p>

          <h3>Housing Guide</h3>
          <p>美国租房与避坑指南。</p>
        </div>
      </div>
    </main>
  );
}
