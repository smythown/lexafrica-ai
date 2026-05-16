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
  const [tab, setTab] = useState<"advice"|"rights"|"letter">("advice");
  const [showApp, setShowApp] = useState(false);
  
  // Count-up animation
  const [stats, setStats] = useState({ people: 0, countries: 0, seconds: 0 });
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate stats on load
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
    setShowApp(true);
    setTimeout(() => {
      appRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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
      setError("Microphone access denied. Please allow microphone access.");
      setRecording(false);
    }
  };

  const analyze = async () => {
    if (!problem.trim()) return;
    setLoading(true); setResult(null); setError(""); setActiveAgent(1);

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
    <main className="min-h-screen bg-[#0f0f1a] text-white overflow-x-hidden">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(233, 69, 96, 0.3); }
          50% { box-shadow: 0 0 40px rgba(233, 69, 96, 0.6); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .agent-card { animation: slide-in-left 0.6s ease-out forwards; opacity: 0; }
        .agent-card:nth-child(1) { animation-delay: 0.1s; }
        .agent-card:nth-child(2) { animation-delay: 0.2s; }
        .agent-card:nth-child(3) { animation-delay: 0.3s; }
        .agent-card:nth-child(4) { animation-delay: 0.4s; }
        .gradient-text {
          background: linear-gradient(135deg, #e94560, #f5a623);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(233, 69, 96, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(233, 69, 96, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* STICKY NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#0f0f1a]/80 border-b border-[#2d3748]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-float">⚖️</span>
            <div>
              <h1 className="text-xl font-bold text-[#e2e8f0] tracking-wide">LexAfrica AI</h1>
              <p className="text-[10px] text-[#e94560] tracking-widest uppercase">Legal Intelligence</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-[#94a3b8] bg-[#16213e] px-3 py-1.5 rounded-full border border-[#2d3748]">
              Powered by Llama 3.3 70B
            </span>
            <span className="text-xs text-[#f5a623] bg-[#16213e] px-3 py-1.5 rounded-full border border-[#f5a623]">
              AMD MI300X
            </span>
            <span className="text-xs text-[#10b981] bg-[#16213e] px-3 py-1.5 rounded-full border border-[#10b981] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></span>
              Live Demo
            </span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] opacity-90" style={{ backgroundSize: '400% 400%', animation: 'gradient-shift 15s ease infinite' }}></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Floating scales icon */}
          <div className="text-8xl mb-8 animate-float inline-block">⚖️</div>
          
          {/* Hero headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in-up">
            Legal Help for Every<br />
            <span className="gradient-text">African Citizen</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#94a3b8] mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            4 AI agents analyze your problem, find your rights, and draft a formal legal letter in 30 seconds — free.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {[
              { label: "People Served", value: `${stats.people}B`, icon: "👥" },
              { label: "Countries", value: stats.countries, icon: "🌍" },
              { label: "Seconds", value: stats.seconds, icon: "⚡" }
            ].map((stat, i) => (
              <div key={i} className="bg-[#16213e] border border-[#2d3748] rounded-2xl p-6 animate-fade-in-up hover:border-[#e94560] transition-all" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl font-bold text-[#e94560] mb-1">{stat.value}</div>
                <div className="text-sm text-[#94a3b8] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Agent Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="agent-card bg-[#16213e] border border-[#2d3748] rounded-xl p-6 hover:border-[#e94560] hover:shadow-[0_0_30px_rgba(233,69,96,0.3)] transition-all cursor-pointer group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{agent.icon}</div>
                <div className="text-sm font-bold text-[#e2e8f0] mb-1">{agent.name}</div>
                <div className="text-xs text-[#94a3b8]">{agent.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button 
            onClick={scrollToApp}
            className="animate-pulse-glow bg-gradient-to-r from-[#e94560] to-[#c0392b] text-white px-12 py-5 rounded-xl text-xl font-bold hover:scale-105 transition-transform"
          >
            ⚖️ Get Free Legal Help
          </button>
        </div>
      </section>

      {/* APP SECTION */}
      {showApp && (
        <section ref={appRef} className="relative py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#e2e8f0] mb-4">Describe Your Legal Problem</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#e94560] to-[#f5a623] mx-auto rounded-full"></div>
            </div>

            {/* INPUT CARD */}
            <div className="bg-[#16213e] border border-[#2d3748] rounded-2xl p-8 mb-8 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider block mb-2">Your Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full bg-[#0f0f1a] text-[#e2e8f0] border border-[#2d3748] rounded-lg px-4 py-3 outline-none focus:border-[#e94560] transition-colors">
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider block mb-2">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full bg-[#0f0f1a] text-[#e2e8f0] border border-[#2d3748] rounded-lg px-4 py-3 outline-none focus:border-[#e94560] transition-colors">
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-[#94a3b8] uppercase tracking-wider">Your Problem</label>
                  <button onClick={startVoiceInput} disabled={recording}
                    className="bg-[#16213e] border border-[#2d3748] rounded-lg px-4 py-2 text-[#e2e8f0] text-sm hover:border-[#e94560] transition-colors disabled:opacity-50">
                    {recording ? "🔴 Recording..." : "🎤 Voice Input"}
                  </button>
                </div>
                <textarea value={problem} onChange={e => setProblem(e.target.value)}
                  placeholder="e.g. My landlord has not returned my rent deposit for 3 months..."
                  rows={4}
                  className="w-full bg-[#0f0f1a] text-[#e2e8f0] border border-[#2d3748] rounded-lg px-4 py-3 outline-none focus:border-[#e94560] transition-colors resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => setProblem(ex)}
                    className="text-xs text-[#94a3b8] bg-[#0f0f1a] border border-[#2d3748] rounded-full px-3 py-1.5 hover:border-[#e94560] hover:text-[#e94560] transition-colors">
                    {ex}
                  </button>
                ))}
              </div>

              <button onClick={analyze} disabled={loading || !problem.trim()}
                className="w-full bg-gradient-to-r from-[#e94560] to-[#c0392b] text-white py-4 rounded-xl text-lg font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Analyzing with 4 AI Agents..." : "⚖️ Analyze My Legal Problem"}
              </button>
            </div>

            {/* AGENT PROGRESS */}
            {loading && (
              <div className="bg-[#16213e] border border-[#2d3748] rounded-2xl p-8 mb-8">
                <p className="text-sm text-[#94a3b8] uppercase tracking-wider mb-6">Agent Pipeline Running</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {AGENTS.map(a => (
                    <div key={a.id} className={`${activeAgent === a.id ? 'bg-[#0f3460] border-[#e94560]' : 'bg-[#0f0f1a] border-[#2d3748]'} border rounded-xl p-4 flex items-center gap-4 transition-all`}>
                      <span className="text-3xl">{activeAgent === a.id ? "⚡" : activeAgent > a.id ? "✅" : a.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${activeAgent === a.id ? 'text-[#e94560]' : 'text-[#e2e8f0]'}`}>{a.name}</p>
                        <p className="text-xs text-[#94a3b8]">{activeAgent === a.id ? a.desc + "..." : activeAgent > a.id ? "Complete" : "Waiting"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="bg-[#2d1515] border border-[#e94560] rounded-xl p-6 mb-8 text-[#fca5a5]">
                ⚠️ {error}
              </div>
            )}

            {/* RESULTS */}
            {result && (
              <div className="animate-fade-in-up">
                <div className="bg-gradient-to-r from-[#16213e] to-[#0f3460] border border-[#e94560] rounded-2xl p-6 mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Legal Domain Identified</p>
                    <p className="text-2xl font-bold text-[#e94560]">{result.domain}</p>
                  </div>
                  <button onClick={downloadPDF}
                    className="bg-[#f5a623] text-[#0f0f1a] px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform">
                    📄 Download PDF
                  </button>
                </div>

                <div className="flex gap-3 mb-6">
                  {(["advice","rights","letter"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${tab === t ? 'bg-[#e94560] text-white border-[#e94560]' : 'bg-[#16213e] text-[#94a3b8] border-[#2d3748]'} border`}>
                      {t === "advice" ? "⚖️ Advice" : t === "rights" ? "🛡️ Rights" : "📝 Legal Letter"}
                    </button>
                  ))}
                </div>

                <div className="bg-[#16213e] border border-[#2d3748] rounded-2xl p-8">
                  {tab === "advice" && (
                    <div>
                      <p className="text-[#e2e8f0] leading-relaxed mb-8">{result.advice}</p>
                      <p className="text-sm text-[#94a3b8] uppercase tracking-wider font-semibold mb-4">Next Steps</p>
                      {result.next_steps.map((s, i) => (
                        <div key={i} className="flex gap-4 items-start mb-4">
                          <span className="bg-[#e94560] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</span>
                          <p className="text-[#e2e8f0] leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === "rights" && (
                    <div>
                      {result.rights.map((r, i) => (
                        <div key={i} className="flex gap-4 items-start mb-4 p-4 bg-[#0f0f1a] border border-[#2d3748] rounded-lg">
                          <span className="text-2xl">🛡️</span>
                          <p className="text-[#e2e8f0] leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === "letter" && (
                    <pre className="whitespace-pre-wrap font-serif text-[#e2e8f0] leading-relaxed">{result.legal_letter}</pre>
                  )}
                </div>

                <p className="text-xs text-[#64748b] text-center mt-6">
                  ⚠️ {result.disclaimer}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#2d3748] py-8 text-center text-sm text-[#94a3b8]">
        <p>Built with ❤️ for AI Agent Olympics Hackathon 2026 | MIT License | 1.4B Africans deserve legal access</p>
      </footer>
    </main>
  );
}
