"use client";
import { useState } from "react";

const AGENTS = [
  { id: 1, name: "Intake Agent",    icon: "🔍", desc: "Classifying legal domain" },
  { id: 2, name: "Research Agent",  icon: "📚", desc: "Finding applicable laws" },
  { id: 3, name: "Advisor Agent",   icon: "⚖️",  desc: "Drafting advice" },
  { id: 4, name: "Document Agent",  icon: "📝", desc: "Generating legal letter" },
];

const COUNTRIES = ["Nigeria","Ghana","Kenya","South Africa","Ethiopia","Tanzania","Uganda","Rwanda","Senegal","Cameroon"];
const LANGUAGES = ["English"]; // More languages available in production with paid API

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
}

export default function Home() {
  const [problem, setProblem]   = useState("");
  const [country, setCountry]   = useState("Nigeria");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [result, setResult]     = useState<Result | null>(null);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState<"advice"|"rights"|"letter">("advice");

  const startVoiceInput = async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setProblem("🎤 Processing your voice input...");
        
        // Simulate transcription (replace with Speechmatics API when you have credits)
        setTimeout(() => {
          setProblem("My landlord has not returned my security deposit for 3 months after I moved out");
          setRecording(false);
        }, 2000);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access.");
      setRecording(false);
    }
  };

  const analyze = async () => {
    if (!problem.trim()) return;
    setLoading(true); setResult(null); setError(""); setActiveAgent(1);

    // Simulate agent progress
    const timers = AGENTS.map((a, i) =>
      setTimeout(() => setActiveAgent(a.id), i * 3000)
    );

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
      setError(e.message || "Something went wrong. Is the backend running?");
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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "lexafrica-report.pdf"; a.click();
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)" }}>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #2d3748", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }}>⚖️</span>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.05em" }}>LexAfrica AI</h1>
            <p style={{ fontSize: "0.65rem", color: "#e94560", letterSpacing: "0.15em", textTransform: "uppercase" }}>Legal Intelligence for Africa</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8", background: "#16213e", padding: "0.25rem 0.75rem", borderRadius: "999px", border: "1px solid #2d3748" }}>
            Powered by Llama 3.3 70B
          </span>
          <span style={{ fontSize: "0.7rem", color: "#f5a623", background: "#16213e", padding: "0.25rem 0.75rem", borderRadius: "999px", border: "1px solid #f5a623" }}>
            AMD MI300X
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* HERO */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 800, color: "#e2e8f0", lineHeight: 1.2, marginBottom: "1rem" }}>
            Legal Help for Every<br />
            <span style={{ color: "#e94560" }}>African Citizen</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            4 specialized AI agents analyze your legal problem, find your rights, and draft a formal letter — in seconds.
          </p>
        </div>

        {/* INPUT CARD */}
        <div style={{ background: "#16213e", borderRadius: "1rem", border: "1px solid #2d3748", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 0 40px rgba(233,69,96,0.1)" }}>

          {/* Country selector */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.6rem 1rem", fontSize: "0.95rem", width: "100%", outline: "none" }}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Language selector */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferred Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.6rem 1rem", fontSize: "0.95rem", width: "100%", outline: "none" }}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Problem input */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Describe Your Legal Problem</label>
              <button onClick={startVoiceInput} disabled={recording}
                style={{ background: recording ? "#e94560" : "#16213e", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.4rem 0.8rem", color: "#e2e8f0", fontSize: "0.75rem", cursor: recording ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {recording ? "🔴 Recording..." : "🎤 Voice Input"}
              </button>
            </div>
            <textarea value={problem} onChange={e => setProblem(e.target.value)}
              placeholder="e.g. My landlord has not returned my rent deposit for 3 months after I moved out..."
              rows={4}
              style={{ width: "100%", background: "#0f0f1a", color: "#e2e8f0", border: "1px solid #2d3748", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.95rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Example pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setProblem(ex)}
                style={{ fontSize: "0.75rem", color: "#94a3b8", background: "#0f0f1a", border: "1px solid #2d3748", borderRadius: "999px", padding: "0.3rem 0.75rem", cursor: "pointer" }}>
                {ex}
              </button>
            ))}
          </div>

          <button onClick={analyze} disabled={loading || !problem.trim()}
            style={{ width: "100%", padding: "0.9rem", background: loading ? "#2d3748" : "linear-gradient(135deg, #e94560, #c0392b)", color: "#fff", border: "none", borderRadius: "0.6rem", fontSize: "1rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em", transition: "all 0.2s" }}>
            {loading ? "Analyzing with 4 AI Agents..." : "⚖️ Analyze My Legal Problem"}
          </button>
        </div>

        {/* AGENT PROGRESS */}
        {loading && (
          <div style={{ background: "#16213e", borderRadius: "1rem", border: "1px solid #2d3748", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Agent Pipeline Running</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              {AGENTS.map(a => (
                <div key={a.id} style={{ background: activeAgent === a.id ? "#0f3460" : "#0f0f1a", border: `1px solid ${activeAgent === a.id ? "#e94560" : "#2d3748"}`, borderRadius: "0.6rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", transition: "all 0.3s" }}>
                  <span style={{ fontSize: "1.5rem" }}>{activeAgent === a.id ? "⚡" : activeAgent > a.id ? "✅" : a.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: activeAgent === a.id ? "#e94560" : "#e2e8f0" }}>{a.name}</p>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{activeAgent === a.id ? a.desc + "..." : activeAgent > a.id ? "Complete" : "Waiting"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ background: "#2d1515", border: "1px solid #e94560", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", color: "#fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div style={{ animation: "slideUp 0.5s ease" }}>

            {/* Domain badge */}
            <div style={{ background: "linear-gradient(135deg, #16213e, #0f3460)", borderRadius: "1rem", border: "1px solid #e94560", padding: "1.25rem 1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Legal Domain Identified</p>
                <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#e94560", marginTop: "0.2rem" }}>{result.domain}</p>
              </div>
              <button onClick={downloadPDF}
                style={{ background: "#f5a623", color: "#0f0f1a", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.2rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                📄 Download PDF
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              {(["advice","rights","letter"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: `1px solid ${tab === t ? "#e94560" : "#2d3748"}`, background: tab === t ? "#e94560" : "#16213e", color: tab === t ? "#fff" : "#94a3b8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", textTransform: "capitalize" }}>
                  {t === "advice" ? "⚖️ Advice" : t === "rights" ? "🛡️ Rights" : "📝 Legal Letter"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ background: "#16213e", borderRadius: "1rem", border: "1px solid #2d3748", padding: "1.5rem" }}>
              {tab === "advice" && (
                <div>
                  <p style={{ color: "#e2e8f0", lineHeight: 1.8, marginBottom: "1.5rem" }}>{result.advice}</p>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Next Steps</p>
                  {result.next_steps.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                      <span style={{ background: "#e94560", color: "#fff", borderRadius: "50%", width: "1.4rem", height: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" }}>{i+1}</span>
                      <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.6 }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "rights" && (
                <div>
                  {result.rights.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.75rem", padding: "0.75rem", background: "#0f0f1a", borderRadius: "0.5rem", border: "1px solid #2d3748" }}>
                      <span style={{ color: "#e94560", fontSize: "1.1rem", flexShrink: 0 }}>🛡️</span>
                      <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.6 }}>{r}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "letter" && (
                <div>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "0.9rem", color: "#e2e8f0", lineHeight: 1.8 }}>{result.legal_letter}</pre>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: "1rem", padding: "0 1rem" }}>
              ⚠️ {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}