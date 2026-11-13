export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-8 font-sans">
      <header className="border-b border-slate-700 pb-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
          Rotation Compass
        </h1>
        <p className="text-slate-400 mt-1">
          NASA Space Apps Challenge 2026 — Climate-Aware Crop Rotation Planning
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Demonstration Region: Ludhiana District, Punjab, India (30.90° N, 75.85° E)
        </p>
      </header>

      <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700 space-y-4">
        <h2 className="text-xl font-semibold text-slate-200">
          Backend API Status: Active
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          The backend provides transparent, explainable climate indicators derived from NASA POWER Daily historical data.
        </p>
        
        <div className="bg-slate-950 p-4 rounded text-xs font-mono border border-slate-800 space-y-2">
          <div className="text-emerald-400 font-semibold">Ready Endpoints:</div>
          <div>
            <span className="text-amber-400">GET</span>{" "}
            <a href="/api/climate?lat=30.90&lon=75.85" className="text-blue-400 hover:underline">
              /api/climate?lat=30.90&amp;lon=75.85
            </a>{" "}
            <span className="text-slate-500">(Live NASA POWER Data)</span>
          </div>
          <div>
            <span className="text-amber-400">GET</span>{" "}
            <a href="/api/climate?lat=30.90&lon=75.85&mock=true" className="text-blue-400 hover:underline">
              /api/climate?lat=30.90&amp;lon=75.85&amp;mock=true
            </a>{" "}
            <span className="text-slate-500">(Calibrated Mock for Frontend)</span>
          </div>
        </div>
      </section>
    </main>
  );
}
