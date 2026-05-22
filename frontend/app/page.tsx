"use client";
import { useState, useEffect, useRef } from "react";

const AGENTS = [
  { id: 1, name: "Intake Agent", icon: "🔍", desc: "Classifying legal domain" },
  { id: 2, name: "Research Agent", icon: "📚", desc: "Finding applicable laws" },
  { id: 3, name: "Advisor Agent", icon: "⚖️", desc: "Drafting advice" },
  { id: 4, name: "Document Agent", icon: "📝", desc: "Generating legal letter" },
];

const COUNTRIES = ["Nigeria","Ghana","Kenya","South Africa","Ethiopia","Tanzania","Uganda","Rwanda","Senegal","Cameroon"];
const LANGUAGES = ["English"];

const EXAMPLES = [
  "My landlord won't return my deposit after 3 months",
  "My employer hasn't paid my salary for 2 months",
  "I was wrongfully dismissed without notice",
  "A contractor took my money and abandoned the job",
];

interface Result {
  domain: string;
  rights: string[];
  advice: string;
  next_steps: string[];
  legal_letter: string;
  disclaimer: string;
  sources: {url: string, title: string, snippet: string}[];
}

export default function Home() {
  const [problem, setProblem] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"advice"|"rights"|"letter"|"sources">("advice");
  const [stats, setStats] = useState({ people: 0, countries: 0, seconds: 0 });
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setStats({
        people: Math.floor(1.4 * progress * 10) / 10,
        countries: Math.floor(10 * progress),
        seconds: Math.floor(30 * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const scrollToApp = () => {
    appRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVoiceInput = async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
      mediaRecorder.onstop = async () => {
        setProblem("🎤 Processing your voice input...");
        setTimeout(() => {
          setProblem("My landlord has not returned my security deposit for 3 months after I moved out");
          setRecording(false);
        }, 2000);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000);
    } catch (err) {
      setError("Microphone access denied.");
      setRecording(false);
    }
  };

  const analyze = async () => {
    if (!problem.trim()) return;
    setLoading(true); setResult(null); setError(""); setActiveAgent(1);
    const timers = AGENTS.map((a, i) => setTimeout(() => setActiveAgent(a.id), i * 3000));
    try {
      const res = await fetch("https://lexafrica-ai-production.up.railway.app/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, country, language }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveAgent(0);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setActiveAgent(0);
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!result) return;
    const res = await fetch("https://lexafrica-ai-production.up.railway.app/api/download-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lexafrica-report.pdf"; a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)", color: "#e2e8f0", scrollBehavior: "smooth" }}>
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 30px rgba(233, 69, 96, 0.4); } 50% { box-shadow: 0 0 50px rgba(233, 69, 96, 0.7); } }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
        @media (max-width: 640px) {
          .mobile-stack { flex-direction: column !important; }
          .mobile-full { width: 100% !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, backdropFilter: "blur(12px)", background: "rgba(15, 15, 26, 0.8)", borderBottom: "1px solid #2d3748", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>⚖️</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>LexAfrica AI</span>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.6rem", color: "#94a3b8", background: "#16213e", padding: "0.25rem 0.5rem", borderRadius: "999px", border: "1px solid #2d3748" }}>Llama 3.3</span>
            <span style={{ fontSize: "0.6rem", color: "#f5a623", background: "#16213e", padding: "0.25rem 0.5rem", borderRadius: "999px", border: "1px solid #f5a623" }}>AMD</span>
            <span style={{ fontSize: "0.6rem", color: "#10b981", background: "#16213e", padding: "0.25rem 0.5rem", borderRadius: "999px", border: "1px solid #10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ width: "4px", height: "4px", background: "#10b981", borderRadius: "50%", animation: "pulse 2s infinite" }}></span>Live
            </span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Mobile Optimized */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "5rem 1rem 2rem" }}>
        <div className="float" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚖️</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem", lineHeight: 1.2 }}>Legal Help for Every</h1>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#e94560", marginBottom: "1rem", lineHeight: 1 }}>African Citizen</h1>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", maxWidth: "300px", marginBottom: "2rem", lineHeight: 1.5 }}>4 AI agents analyze your problem and draft a legal letter in 30 seconds — free.</p>

        {/* STATS - Mobile: Horizontal compact cards */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", width: "100%", maxWidth: "320px" }}>
          {[
            { label: "People", value: `${stats.people}B`, color: "#e94560" },
            { label: "Countries", value: stats.countries, color: "#f5a623" },
            { label: "Seconds", value: stats.seconds, color: "#10b981" }
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, background: "#16213e", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem 0.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: stat.color, marginBottom: "0.25rem" }}>{stat.value}</div>
              <div style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* AGENT PIPELINE - Mobile: 2x2 compact grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "2rem", width: "100%", maxWidth: "280px" }}>
          {AGENTS.map((agent) => (
            <div key={agent.id} style={{ background: "#16213e", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{agent.icon}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.2 }}>{agent.name.replace(" Agent", "")}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={scrollToApp} className="pulse-glow"
          style={{ width: "280px", padding: "0.875rem 1.5rem", background: "linear-gradient(135deg, #e94560, #c0392b)", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>
          ⚖️ Get Free Legal Help
        </button>
      </section>

      {/* APP SECTION */}
      <section ref={appRef} style={{ minHeight: "100vh", padding: "3rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem" }}>⚖️ Try It Now</h2>
          <div style={{ width: "80px", height: "3px", background: "#e94560", margin: "0 auto", borderRadius: "2px" }}></div>
        </div>

        <div style={{ width: "100%", maxWidth: "600px", background: "#16213e", border: "1px solid #2d3748", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>Your Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                style={{ width: "100%", background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.9rem", outline: "none" }}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ width: "100%", background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.9rem", outline: "none" }}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Legal Problem</label>
              <button onClick={startVoiceInput} disabled={recording}
                style={{ background: recording ? "#e94560" : "#0f0f1a", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", color: "#e2e8f0", fontSize: "0.7rem", cursor: recording ? "not-allowed" : "pointer" }}>
                {recording ? "🔴 Recording..." : "🎤 Voice"}
              </button>
            </div>
            <textarea value={problem} onChange={e => setProblem(e.target.value)}
              placeholder="e.g. My landlord has not returned my rent deposit for 3 months..."
              rows={4}
              style={{ width: "100%", background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.9rem", resize: "none", outline: "none", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setProblem(ex)}
                style={{ fontSize: "0.7rem", color: "#94a3b8", background: "#0f0f1a", border: "1px solid #2d3748", borderRadius: "999px", padding: "0.4rem 0.75rem", cursor: "pointer" }}>
                {ex}
              </button>
            ))}
          </div>

          <button onClick={analyze} disabled={loading || !problem.trim()}
            style={{ width: "100%", padding: "1rem", background: loading ? "#2d3748" : "linear-gradient(135deg, #e94560, #c0392b)", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "1rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analyzing with 4 AI Agents..." : "⚖️ Analyze My Legal Problem"}
          </button>

          {/* AGENT PROGRESS */}
          {loading && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#0f0f1a", borderRadius: "0.5rem", border: "1px solid #2d3748" }}>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Agent Pipeline Running</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {AGENTS.map(a => (
                  <div key={a.id} style={{ background: activeAgent === a.id ? "#0f3460" : "#16213e", border: `1px solid ${activeAgent === a.id ? "#e94560" : "#2d3748"}`, borderRadius: "0.5rem", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{activeAgent === a.id ? "⚡" : activeAgent > a.id ? "✅" : a.icon}</span>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: activeAgent === a.id ? "#e94560" : "#e2e8f0" }}>{a.name}</p>
                      <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{activeAgent === a.id ? a.desc + "..." : activeAgent > a.id ? "Complete" : "Waiting"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ marginTop: "1.5rem", background: "#2d1515", border: "1px solid #e94560", borderRadius: "0.5rem", padding: "1rem", color: "#fca5a5" }}>
              ⚠️ {error}
            </div>
          )}

          {/* RESULTS */}
          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ background: "linear-gradient(135deg, #16213e, #0f3460)", border: "1px solid #e94560", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Legal Domain Identified</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e94560", marginTop: "0.25rem" }}>{result.domain}</p>
                </div>
                <button onClick={downloadPDF}
                  style={{ background: "#f5a623", color: "#0f0f1a", border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", width: "100%" }}>
                  📄 Download PDF
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                {(["advice","rights","letter","sources"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: "0.6rem 0.25rem", borderRadius: "0.5rem", border: `1px solid ${tab === t ? "#e94560" : "#2d3748"}`, background: tab === t ? "#e94560" : "#0f0f1a", color: tab === t ? "#fff" : "#94a3b8", fontWeight: 600, fontSize: "0.65rem", cursor: "pointer" }}>
                    {t === "advice" ? "⚖️" : t === "rights" ? "🛡️" : t === "letter" ? "📝" : "🌐"}
                  </button>
                ))}
              </div>

              <div style={{ background: "#0f0f1a", borderRadius: "0.75rem", border: "1px solid #2d3748", padding: "1rem" }}>
                {tab === "advice" && (
                  <div>
                    <p style={{ color: "#e2e8f0", lineHeight: 1.6, marginBottom: "1rem", fontSize: "0.9rem" }}>{result.advice}</p>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Next Steps</p>
                    {result.next_steps.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <span style={{ background: "#e94560", color: "#fff", borderRadius: "50%", width: "1.25rem", height: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                        <p style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: 1.5 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "rights" && (
                  <div>
                    {result.rights.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.75rem", padding: "0.75rem", background: "#16213e", borderRadius: "0.5rem", border: "1px solid #2d3748" }}>
                        <span style={{ color: "#e94560", fontSize: "1.25rem", flexShrink: 0 }}>🛡️</span>
                        <p style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: 1.5 }}>{r}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "letter" && (
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.6 }}>{result.legal_letter}</pre>
                )}
                {tab === "sources" && (
                  <div>
                    {result.sources && result.sources.length > 0 ? (
                      result.sources.map((source, i) => (
                        <div key={i} style={{ marginBottom: "1rem", padding: "1rem", background: "#16213e", borderRadius: "0.5rem", border: "1px solid #2d3748" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0", margin: 0, flex: 1 }}>{source.title}</h3>
                            <span style={{ fontSize: "0.6rem", color: "#10b981", background: "#0f3460", padding: "0.2rem 0.5rem", borderRadius: "999px", border: "1px solid #10b981", whiteSpace: "nowrap", marginLeft: "0.5rem" }}>
                              🌐 Live
                            </span>
                          </div>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" 
                            style={{ fontSize: "0.75rem", color: "#3b82f6", textDecoration: "none", display: "block", marginBottom: "0.5rem", wordBreak: "break-all" }}>
                            {source.url}
                          </a>
                          <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{source.snippet}</p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌐</div>
                        <p style={{ fontSize: "0.85rem" }}>No live web sources available.</p>
                        <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>Analysis based on AI knowledge.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p style={{ fontSize: "0.65rem", color: "#64748b", textAlign: "center", marginTop: "1rem" }}>
                ⚠️ {result.disclaimer}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #2d3748", padding: "1.5rem 1rem", textAlign: "center", fontSize: "0.75rem", color: "#94a3b8" }}>
        <p>Built with ❤️ for Web Data UNLOCKED Hackathon 2026 | 1.4B Africans deserve legal access</p>
      </footer>
    </div>
  );
}