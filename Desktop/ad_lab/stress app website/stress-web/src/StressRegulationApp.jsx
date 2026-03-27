import { useState, useEffect, useRef, useCallback } from "react";

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  blue:    "#00BFFF",
  blueDk:  "#0099CC",
  navy:    "#1A1A2E",
  bg:      "#F5F7FA",
  white:   "#FFFFFF",
  card:    "#FFFFFF",
  low:     "#4CAF50",
  mod:     "#FF9800",
  high:    "#F44336",
  txt1:    "#1A1A2E",
  txt2:    "#666666",
  hint:    "#AAAAAA",
  div:     "#E0E0E0",
};

const API = "http://localhost:3000";

// ── Tiny helpers ───────────────────────────────────────────────────────────
const stressColor = s => s < 0.3 ? C.low : s < 0.6 ? C.mod : C.high;
const stressLabel = s => s < 0.3 ? "Low Stress" : s < 0.6 ? "Moderate" : "High Stress";

// ── Global styles injected once ────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: ${C.bg}; color: ${C.txt1}; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.div}; border-radius: 3px; }

  .app-wrap { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar { width: 240px; background: ${C.navy}; color: #fff; display: flex; flex-direction: column;
             padding: 24px 0; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; }
  .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 20px 28px; border-bottom: 1px solid rgba(255,255,255,.1); }
  .sidebar-logo-icon { width: 36px; height: 36px; background: ${C.blue}; border-radius: 10px;
                        display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .sidebar-logo-text { font-size: 14px; font-weight: 700; line-height: 1.2; }
  .sidebar-logo-sub  { font-size: 11px; color: rgba(255,255,255,.5); }
  .sidebar-nav { flex: 1; padding: 16px 0; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 20px; cursor: pointer;
              font-size: 14px; font-weight: 500; color: rgba(255,255,255,.6); transition: all .2s;
              border-left: 3px solid transparent; }
  .nav-item:hover { background: rgba(255,255,255,.05); color: #fff; }
  .nav-item.active { background: rgba(0,191,255,.12); color: ${C.blue}; border-left-color: ${C.blue}; }
  .nav-item .nav-icon { font-size: 18px; width: 22px; text-align: center; }
  .sidebar-bottom { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,.1); font-size: 12px; color: rgba(255,255,255,.35); }

  /* Main */
  .main { margin-left: 240px; flex: 1; padding: 28px; min-height: 100vh; }

  /* Cards */
  .card { background: ${C.white}; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.06); padding: 20px; }
  .card-sm { padding: 16px; border-radius: 12px; }

  /* Grid helpers */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }

  /* Buttons */
  .btn { border: none; cursor: pointer; font-family: inherit; font-weight: 600; border-radius: 10px;
         padding: 12px 24px; font-size: 14px; transition: all .2s; }
  .btn-primary { background: ${C.blue}; color: #fff; }
  .btn-primary:hover { background: ${C.blueDk}; transform: translateY(-1px); }
  .btn-danger  { background: ${C.high}; color: #fff; }
  .btn-ghost   { background: transparent; border: 1.5px solid ${C.div}; color: ${C.txt2}; }
  .btn-full    { width: 100%; }
  .btn-lg      { padding: 15px 28px; font-size: 16px; border-radius: 12px; }

  /* Badge */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
           border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-connected { background: #e3f6ff; color: ${C.blue}; border: 1px solid ${C.blue}; }
  .badge-low  { background: #e8f5e9; color: ${C.low}; }
  .badge-mod  { background: #fff3e0; color: ${C.mod}; }
  .badge-high { background: #ffebee; color: ${C.high}; }

  /* Input */
  .input-wrap { position: relative; margin-bottom: 16px; }
  .input-wrap label { display: block; font-size: 13px; font-weight: 600; color: ${C.txt2}; margin-bottom: 6px; }
  .input-field { width: 100%; padding: 13px 16px; border: 1.5px solid ${C.div}; border-radius: 10px;
                 font-family: inherit; font-size: 14px; color: ${C.txt1}; background: ${C.bg};
                 outline: none; transition: border .2s; }
  .input-field:focus { border-color: ${C.blue}; background: #fff; }

  /* Section title */
  .section-title { font-size: 18px; font-weight: 700; color: ${C.txt1}; margin-bottom: 16px; }
  .section-sub   { font-size: 13px; color: ${C.txt2}; margin-top: 2px; }

  /* Stress ring */
  .stress-ring-wrap { display: flex; flex-direction: column; align-items: center; padding: 24px 0; }
  .stress-score-num { font-size: 48px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .stress-score-lbl { font-size: 15px; font-weight: 600; margin-top: 4px; }
  .stress-score-sub { font-size: 12px; color: ${C.txt2}; margin-top: 2px; }

  /* Chat */
  .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 120px); max-width: 680px; }
  .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px; }
  .chat-bubble { max-width: 75%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
  .chat-bubble.bot  { background: ${C.white}; color: ${C.txt1}; border-bottom-left-radius: 4px; box-shadow: 0 1px 6px rgba(0,0,0,.07); align-self: flex-start; }
  .chat-bubble.user { background: ${C.blue}; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
  .chat-options { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .chat-option-btn { padding: 11px 18px; border: 1.5px solid ${C.blue}; border-radius: 10px; background: #fff;
                     color: ${C.txt1}; font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
                     transition: all .2s; text-align: left; }
  .chat-option-btn:hover { background: ${C.blue}; color: #fff; }

  /* Score result card */
  .score-result { text-align: center; padding: 32px; }
  .score-result-num { font-size: 64px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .score-result-lbl { font-size: 20px; font-weight: 700; margin-top: 4px; }
  .score-result-bar { height: 8px; background: ${C.div}; border-radius: 4px; margin: 16px 0; overflow: hidden; }
  .score-result-fill { height: 100%; border-radius: 4px; transition: width .8s ease; }
  .score-result-advice { font-size: 14px; color: ${C.txt2}; line-height: 1.6; }

  /* Music */
  .beat-card { padding: 16px 12px; border-radius: 12px; border: 2px solid ${C.div}; text-align: center;
               cursor: pointer; transition: all .2s; background: ${C.white}; }
  .beat-card:hover { border-color: ${C.blue}; transform: translateY(-2px); }
  .beat-card.active { border-color: ${C.blue}; background: #e3f6ff; }
  .beat-emoji { font-size: 28px; margin-bottom: 6px; }
  .beat-name  { font-size: 13px; font-weight: 700; color: ${C.txt1}; }
  .beat-freq  { font-size: 11px; margin-top: 2px; }

  /* Breathing */
  .breath-circle { width: 180px; height: 180px; border-radius: 50%; display: flex; flex-direction: column;
                   align-items: center; justify-content: center; margin: 0 auto 20px;
                   transition: transform 1s ease-in-out, box-shadow .5s; }
  .breath-circle.expanding { transform: scale(1.5); box-shadow: 0 0 40px rgba(0,191,255,.4); }
  .breath-circle.shrinking { transform: scale(0.85); }
  .breath-phase { font-size: 16px; font-weight: 700; color: #fff; }
  .breath-count { font-size: 36px; font-weight: 700; font-family: 'DM Mono', monospace; color: #fff; }

  /* Pattern card */
  .pattern-card { padding: 16px; border-radius: 12px; border: 2px solid ${C.div}; cursor: pointer;
                  transition: all .2s; background: ${C.white}; margin-bottom: 12px; }
  .pattern-card:hover { border-color: ${C.blue}; }
  .pattern-card.active { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 8%, white); }

  /* Progress bar */
  .prog-bar { height: 8px; background: ${C.div}; border-radius: 4px; overflow: hidden; margin: 6px 0 14px; }
  .prog-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }

  /* Chart placeholder */
  .chart-area { height: 200px; background: linear-gradient(180deg,#e3f6ff 0%,#fff 100%);
                border-radius: 10px; display: flex; align-items: flex-end; gap: 3px; padding: 12px; overflow: hidden; }
  .chart-bar  { flex: 1; border-radius: 3px 3px 0 0; transition: height .4s; }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th { text-align: left; padding: 10px 12px; font-size: 12px; color: ${C.txt2}; font-weight: 600;
                   border-bottom: 1.5px solid ${C.div}; text-transform: uppercase; letter-spacing: .05em; }
  .data-table td { padding: 12px; border-bottom: 1px solid ${C.div}; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: ${C.bg}; }

  /* Toggle */
  .toggle-wrap { display: flex; align-items: center; justify-content: space-between; padding: 12px 0;
                 border-bottom: 1px solid ${C.div}; }
  .toggle-wrap:last-child { border-bottom: none; }
  .toggle { position: relative; width: 44px; height: 24px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: ${C.div}; border-radius: 24px; cursor: pointer; transition: .3s; }
  .toggle-slider::before { content:''; position:absolute; width:18px; height:18px; left:3px; bottom:3px;
                            background:#fff; border-radius:50%; transition:.3s; }
  .toggle input:checked + .toggle-slider { background: ${C.blue}; }
  .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

  /* Login page */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center;
                background: linear-gradient(135deg, ${C.navy} 0%, #16213e 50%, #0f3460 100%); }
  .login-card { background: #fff; border-radius: 24px; padding: 40px; width: 100%; max-width: 420px;
                box-shadow: 0 24px 64px rgba(0,0,0,.25); }
  .login-icon { width: 64px; height: 64px; background: ${C.navy}; border-radius: 18px; display: flex;
                align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; }
  .login-title { font-size: 24px; font-weight: 700; text-align: center; color: ${C.txt1}; }
  .login-sub   { font-size: 14px; color: ${C.txt2}; text-align: center; margin: 6px 0 28px; }

  /* Misc */
  .flex-row { display: flex; align-items: center; gap: 12px; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .mt-4  { margin-top: 4px;  } .mt-8  { margin-top: 8px;  } .mt-12 { margin-top: 12px; }
  .mt-16 { margin-top: 16px; } .mt-24 { margin-top: 24px; }
  .mb-16 { margin-bottom: 16px; } .mb-24 { margin-bottom: 24px; }
  .text-sm  { font-size: 12px; } .text-xs { font-size: 11px; }
  .text-muted { color: ${C.txt2}; } .text-blue { color: ${C.blue}; }
  .font-bold { font-weight: 700; } .font-mono { font-family: 'DM Mono', monospace; }
  .w-full { width: 100%; }
  @media (max-width: 900px) {
    .sidebar { width: 60px; } .sidebar-logo-text,.sidebar-logo-sub,.nav-item span { display: none; }
    .nav-item { justify-content: center; padding: 14px; }
    .main { margin-left: 60px; }
    .grid-4 { grid-template-columns: 1fr 1fr; } .grid-3 { grid-template-columns: 1fr 1fr; }
  }
`;

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !pass) { setErr("Please fill in all fields"); return; }
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      const d = await r.json();
      if (r.ok) { onLogin(d.user || { email }); }
      else { setErr(d.message || "Login failed"); }
    } catch {
      // Offline fallback
      if (email && pass) onLogin({ email, name: email.split("@")[0] });
      else setErr("Connection failed. Check your server.");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">❤️</div>
        <div className="login-title">Stress Regulation App</div>
        <div className="login-sub">Monitor and manage your stress in real time.</div>
        <div className="input-wrap">
          <label>Email address</label>
          <input className="input-field" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <div className="input-wrap">
          <label>Password</label>
          <input className="input-field" type="password" placeholder="••••••••"
            value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && <p style={{ color: C.high, fontSize: 13, marginBottom: 12 }}>{err}</p>}
        <button className="btn btn-primary btn-full btn-lg" onClick={submit} disabled={loading}>
          {loading ? "Logging in…" : "Login"}
        </button>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.txt2 }}>
          <span style={{ color: C.blue, cursor: "pointer" }}>Forgot Password?</span>
        </p>
        <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.txt2 }}>
          Don't have an account? <span style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }}>Sign Up</span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Home({ stressScore, setStressScore, setPage }) {
  const sc = stressScore;
  const col = stressColor(sc);
  const lbl = stressLabel(sc);

  // SVG ring
  const r = 70, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  const dash = circ * sc;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div style={{ fontSize: 13, color: C.txt2 }}>Good morning,</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>Dashboard 👋</div>
        </div>
        <span className="badge badge-connected">● Connected</span>
      </div>

      {/* Top row */}
      <div className="grid-4 mb-16">
        {[
          { label: "Stress Score", val: sc.toFixed(2), col, icon: "🧠" },
          { label: "Heart Rate",   val: "72 BPM",       col: C.high, icon: "❤️" },
          { label: "HRV Score",    val: "42 ms",         col: C.blue, icon: "⚡" },
          { label: "EEG Delta",    val: "1.8 Hz",        col: C.mod,  icon: "〰️" },
        ].map(m => (
          <div key={m.label} className="card card-sm">
            <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.col, fontFamily: "'DM Mono',monospace" }}>{m.val}</div>
            <div style={{ fontSize: 12, color: C.txt2, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Stress ring */}
        <div className="card" style={{ textAlign: "center" }}>
          <div className="section-title">Stress Index</div>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.div} strokeWidth="14" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="14"
              strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
              strokeLinecap="round" style={{ transition: "stroke-dasharray .8s ease" }} />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="700"
              fill={C.txt1} fontFamily="DM Mono">{sc.toFixed(2)}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="13" fontWeight="600" fill={col}>{lbl}</text>
          </svg>
          <div style={{ fontSize: 13, color: C.txt2, marginTop: 4 }}>
            {sc < 0.3 ? "You're doing great! 😊" : sc < 0.6 ? "Consider a short break 🎵" : "Please try relaxation mode 🧘"}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="section-title">Quick Actions</div>
          <div className="grid-2" style={{ gap: 12 }}>
            {[
              { icon: "🎵", label: "Music",     bg: "#F0F0FF", page: "music" },
              { icon: "🌿", label: "Aroma",     bg: "#F0FFF0", page: "home" },
              { icon: "😌", label: "Relax",     bg: "#FFF0F5", page: "relax" },
              { icon: "🧠", label: "Check-In",  bg: "#E3F6FF", page: "chat" },
            ].map(a => (
              <div key={a.label} onClick={() => setPage(a.page)}
                style={{ background: a.bg, borderRadius: 12, padding: "16px 12px",
                         textAlign: "center", cursor: "pointer", transition: "transform .15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}>
                <div style={{ fontSize: 28 }}>{a.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{a.label}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full mt-16"
            onClick={() => setPage("chat")}>🧠 Start Stress Check-In</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT CHECK-IN
// ══════════════════════════════════════════════════════════════════════════════
const QUESTIONS = [
  { text: "😴 How many hours did you sleep last night?",
    opts: ["Less than 4 hours","4–6 hours","6–8 hours","More than 8 hours"], scores: [1,.6,.2,0] },
  { text: "😊 How is your mood right now?",
    opts: ["Very stressed","Anxious","Neutral","Calm & relaxed"], scores: [1,.7,.3,0] },
  { text: "📅 How busy was your day?",
    opts: ["Extremely overwhelming","Very busy","Moderately busy","Quite relaxed"], scores: [1,.6,.3,0] },
  { text: "🏃 Did you exercise today?",
    opts: ["Not at all","Light walk","Moderate exercise","Intense workout"], scores: [.8,.4,.1,0] },
  { text: "⚡ How is your energy level?",
    opts: ["Completely exhausted","Low energy","Medium energy","High energy"], scores: [1,.6,.3,0] },
];
const WEIGHTS = [.30,.25,.20,.15,.10];

function Chat({ onScore }) {
  const [msgs,    setMsgs]    = useState([]);
  const [qIdx,    setQIdx]    = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [result,  setResult]  = useState(null);
  const [showOpts,setShowOpts]= useState(false);
  const endRef = useRef(null);

  const addBot = useCallback((text, delay = 0) => {
    setTimeout(() => {
      setMsgs(m => [...m, { from: "bot", text }]);
    }, delay);
  }, []);

  useEffect(() => {
    addBot("👋 Hi! I'm your stress assistant. I'll ask you a few quick questions.", 300);
    addBot("This will only take about a minute. Let's begin! 🌟", 1100);
    setTimeout(() => { setQIdx(0); setShowOpts(true); }, 1800);
  }, [addBot]);

  useEffect(() => {
    if (qIdx >= 0 && qIdx < QUESTIONS.length) {
      addBot(`${qIdx + 1}/5  ${QUESTIONS[qIdx].text}`);
    }
  }, [qIdx, addBot]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, showOpts]);

  const pick = (opt, score) => {
    setShowOpts(false);
    setMsgs(m => [...m, { from: "user", text: opt }]);
    const newAns = [...answers, score];
    setAnswers(newAns);
    if (qIdx + 1 >= QUESTIONS.length) {
      // Calculate
      const s = newAns.reduce((acc, a, i) => acc + a * WEIGHTS[i], 0);
      const final = Math.min(1, Math.max(0, s));
      setTimeout(() => {
        const col = stressColor(final);
        const lbl = stressLabel(final);
        addBot(`${final < .3 ? "🟢" : final < .6 ? "🟡" : "🔴"} Based on your answers, your stress score is:`);
        setTimeout(() => { setResult({ score: final, col, lbl }); onScore(final); }, 600);
      }, 400);
    } else {
      setTimeout(() => { setQIdx(q => q + 1); setShowOpts(true); }, 500);
    }
  };

  const reset = () => {
    setMsgs([]); setQIdx(-1); setAnswers([]); setResult(null); setShowOpts(false);
    setTimeout(() => {
      addBot("👋 Let's do another check-in!", 200);
      setTimeout(() => { setQIdx(0); setShowOpts(true); }, 900);
    }, 100);
  };

  return (
    <div>
      <div className="section-title">Stress Check-In 🧠</div>
      <div className="chat-wrap">
        <div className="chat-messages">
          {msgs.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>
          ))}
          {result && (
            <div className="card score-result">
              <div className="score-result-num" style={{ color: result.col }}>{result.score.toFixed(2)}</div>
              <div className="score-result-lbl" style={{ color: result.col }}>{result.lbl}</div>
              <div className="score-result-bar">
                <div className="score-result-fill" style={{ width: `${result.score * 100}%`, background: result.col }} />
              </div>
              <div className="score-result-advice">
                {result.score < .3 ? "You're doing great! Keep up the healthy habits. 😊"
                  : result.score < .6 ? "Some stress detected. Try a short breathing exercise or calming music. 🎵"
                  : "High stress detected! Please try aromatherapy, relaxation mode, or take a break. 🧘"}
              </div>
              <div className="flex-row mt-16" style={{ justifyContent: "center", gap: 10 }}>
                <button className="btn btn-ghost" onClick={reset}>🔄 Retake</button>
              </div>
            </div>
          )}
          {showOpts && qIdx >= 0 && qIdx < QUESTIONS.length && (
            <div className="chat-options">
              {QUESTIONS[qIdx].opts.map((o, i) => (
                <button key={o} className="chat-option-btn"
                  onClick={() => pick(o, QUESTIONS[qIdx].scores[i])}>{o}</button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MUSIC — BINAURAL BEATS
// ══════════════════════════════════════════════════════════════════════════════
const BEATS = [
  { name: "Delta", emoji: "😴", freq: 2,  desc: "Deep sleep",      col: C.blue },
  { name: "Theta", emoji: "🧘", freq: 6,  desc: "Meditation",      col: C.mod },
  { name: "Alpha", emoji: "😌", freq: 10, desc: "Calm focus",      col: C.low },
  { name: "Beta",  emoji: "🎯", freq: 20, desc: "Active thinking", col: C.mod },
  { name: "Gamma", emoji: "⚡", freq: 40, desc: "Peak focus",      col: C.high },
];

function Music() {
  const [sel,     setSel]     = useState(2); // Alpha default
  const [playing, setPlaying] = useState(false);
  const [vol,     setVol]     = useState(50);
  const ctxRef    = useRef(null);
  const nodesRef  = useRef([]);

  const stop = () => {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    setPlaying(false);
  };

  const play = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = vol / 100;
    gain.connect(ctx.destination);
    const base = 200;
    const beat = BEATS[sel].freq;
    const merger = ctx.createChannelMerger(2);
    merger.connect(gain);
    // Left
    const oscL = ctx.createOscillator();
    oscL.frequency.value = base;
    const gainL = ctx.createGain(); gainL.gain.value = 1;
    oscL.connect(gainL); gainL.connect(merger, 0, 0);
    // Right
    const oscR = ctx.createOscillator();
    oscR.frequency.value = base + beat;
    const gainR = ctx.createGain(); gainR.gain.value = 1;
    oscR.connect(gainR); gainR.connect(merger, 0, 1);
    oscL.start(); oscR.start();
    nodesRef.current = [oscL, oscR];
    setPlaying(true);
  };

  const toggle = () => playing ? stop() : play();

  useEffect(() => () => stop(), []);

  return (
    <div>
      <div className="section-title">🎵 Binaural Beats</div>
      <div style={{ maxWidth: 680 }}>
        <div className="card mb-16" style={{ background: `linear-gradient(135deg, ${C.navy}, #16213e)`, color: "#fff" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{BEATS[sel].name} Wave — {BEATS[sel].freq} Hz</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 4 }}>{BEATS[sel].desc}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.4)" }}>
            🎧 Use headphones for binaural beats to work properly
          </div>
        </div>

        <div className="section-title" style={{ fontSize: 15 }}>Choose Brainwave</div>
        <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
          {BEATS.map((b, i) => (
            <div key={b.name} className={`beat-card ${sel === i ? "active" : ""}`}
              onClick={() => { setSel(i); if (playing) { stop(); setTimeout(play, 100); } }}>
              <div className="beat-emoji">{b.emoji}</div>
              <div className="beat-name">{b.name}</div>
              <div className="beat-freq" style={{ color: sel === i ? C.blue : b.col }}>{b.freq} Hz</div>
            </div>
          ))}
        </div>

        <div className="card mb-16">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🔊 Volume</div>
          <input type="range" min="0" max="100" value={vol}
            onChange={e => { setVol(+e.target.value); if (ctxRef.current) ctxRef.current.destination.gain && (ctxRef.current.destination.gain.value = +e.target.value / 100); }}
            style={{ width: "100%", accentColor: C.blue }} />
        </div>

        <div className="card mb-16" style={{ background: "#FFF8E1", border: "none" }}>
          <p style={{ fontSize: 13, color: "#795548" }}>
            🎧 Binaural beats work by playing slightly different frequencies in each ear. Your brain perceives the difference as a rhythmic beat, helping shift brainwave states.
          </p>
        </div>

        <button className="btn btn-lg btn-full" onClick={toggle}
          style={{ background: playing ? C.high : C.blue, color: "#fff", border: "none" }}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BREATHING EXERCISE
// ══════════════════════════════════════════════════════════════════════════════
const PATTERNS = [
  { name: "Low Stress 🟢",    emoji: "🟢", inhale: 4, hold1: 2, exhale: 6, hold2: 0, col: C.low,  desc: "4-2-6 · Gentle & calming" },
  { name: "Medium Stress 🟡", emoji: "🟡", inhale: 4, hold1: 4, exhale: 4, hold2: 4, col: C.mod,  desc: "4-4-4-4 · Box breathing" },
  { name: "High Stress 🔴",   emoji: "🔴", inhale: 4, hold1: 7, exhale: 8, hold2: 0, col: C.high, desc: "4-7-8 · Deep stress relief" },
];

function Relax() {
  const [selPat,  setSelPat]  = useState(0);
  const [running, setRunning] = useState(false);
  const [phase,   setPhase]   = useState("Press Start");
  const [count,   setCount]   = useState("");
  const [cycles,  setCycles]  = useState(0);
  const [expand,  setExpand]  = useState(false);
  const timerRef = useRef(null);
  const runRef   = useRef(false);

  const pat = PATTERNS[selPat];

  const clearT = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const runPhase = (label, secs, isExpand, onDone) => {
    setPhase(label);
    setExpand(!!isExpand);
    let remaining = secs;
    setCount(remaining > 0 ? String(remaining) : "");
    if (remaining === 0) { onDone(); return; }
    clearT();
    timerRef.current = setInterval(() => {
      remaining--;
      setCount(remaining > 0 ? String(remaining) : "");
      if (remaining <= 0) { clearT(); onDone(); }
    }, 1000);
  };

  const runCycle = useCallback(() => {
    if (!runRef.current) return;
    setCycles(c => c + 1);
    runPhase("Inhale 🌬", pat.inhale, true, () => {
      if (!runRef.current) return;
      runPhase("Hold 🤚", pat.hold1, null, () => {
        if (!runRef.current) return;
        runPhase("Exhale 💨", pat.exhale, false, () => {
          if (!runRef.current) return;
          runPhase("Hold 🤚", pat.hold2, null, () => {
            if (runRef.current) runCycle();
          });
        });
      });
    });
  }, [pat]);

  const start = () => {
    runRef.current = true; setRunning(true); setCycles(0); runCycle();
  };
  const stop = () => {
    runRef.current = false; setRunning(false); clearT();
    setPhase("Press Start"); setCount(""); setExpand(false);
  };

  useEffect(() => () => { runRef.current = false; clearT(); }, []);

  return (
    <div>
      <div className="section-title">😮‍💨 Breathing Exercise</div>
      <div style={{ maxWidth: 680 }}>
        {/* Circle */}
        <div className="card mb-16" style={{ textAlign: "center", padding: "32px 20px" }}>
          <div className={`breath-circle ${running ? (expand ? "expanding" : "shrinking") : ""}`}
            style={{ background: pat.col, transition: "transform 1s ease-in-out" }}>
            <div className="breath-phase">{phase}</div>
            {count && <div className="breath-count">{count}</div>}
          </div>
          <div style={{ fontSize: 13, color: C.txt2 }}>{pat.desc}</div>
          {cycles > 0 && <div style={{ fontSize: 14, color: C.blue, fontWeight: 700, marginTop: 8 }}>Cycles: {cycles}</div>}
        </div>

        {/* Patterns */}
        <div className="section-title" style={{ fontSize: 15 }}>Select Stress Level</div>
        {PATTERNS.map((p, i) => (
          <div key={p.name} className={`pattern-card ${selPat === i ? "active" : ""}`}
            style={{ "--pc": p.col }}
            onClick={() => { if (running) stop(); setSelPat(i); }}>
            <div className="flex-row">
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: p.col }}>{p.desc}</div>
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-lg btn-full mt-16" onClick={running ? stop : start}
          style={{ background: running ? C.high : C.blue, color: "#fff", border: "none" }}>
          {running ? "⏹ Stop" : "▶ Start Breathing"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAILS
// ══════════════════════════════════════════════════════════════════════════════
function Details({ stressScore }) {
  const chartData = [0.2, 0.25, 0.3, 0.28, 0.35, 0.4, 0.38, stressScore, 0.42, 0.45];
  const maxH = 160;

  return (
    <div>
      <div className="section-title">Stress Details</div>
      <div className="grid-4 mb-16">
        {[
          { label: "EEG Delta",   val: "1.8 Hz",  col: C.blue },
          { label: "HRV SDNN",    val: "48.3 ms", col: C.mod },
          { label: "Mean HR",     val: "72 BPM",  col: C.high },
          { label: "Peak Stress", val: stressScore.toFixed(2), col: stressColor(stressScore) },
        ].map(m => (
          <div key={m.label} className="card card-sm">
            <div style={{ fontSize: 22, fontWeight: 700, color: m.col, fontFamily: "'DM Mono',monospace" }}>{m.val}</div>
            <div style={{ fontSize: 12, color: C.txt2, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card mb-16">
          <div className="flex-between mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Stress Over Time</div>
            <span style={{ fontSize: 12, color: C.low, fontWeight: 600 }}>● Live</span>
          </div>
          <div className="chart-area">
            {chartData.map((v, i) => (
              <div key={i} className="chart-bar"
                style={{ height: `${(v / 1) * maxH}px`, background: stressColor(v), opacity: .8 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.txt2, marginTop: 6 }}>
            {["8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm"].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Brainwave Analysis</div>
          {[
            { label: "Delta (1–4 Hz) · Deep relaxation", val: 68, col: C.blue },
            { label: "Theta (4–8 Hz) · Calm awareness",  val: 42, col: C.mod },
            { label: "Alpha (8–13 Hz) · Relaxed focus",  val: 55, col: C.low },
            { label: "Beta (13–30 Hz) · Active focus",   val: 30, col: C.high },
          ].map(b => (
            <div key={b.label}>
              <div className="flex-between" style={{ fontSize: 13, color: C.txt2 }}>
                <span>{b.label}</span><span style={{ color: b.col, fontWeight: 700 }}>{b.val}%</span>
              </div>
              <div className="prog-bar">
                <div className="prog-fill" style={{ width: `${b.val}%`, background: b.col }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════════
const HISTORY_DATA = [
  { date: "Mon", score: 0.55, level: "Moderate", sessions: 3 },
  { date: "Tue", score: 0.61, level: "Moderate", sessions: 4 },
  { date: "Wed", score: 0.58, level: "Moderate", sessions: 2 },
  { date: "Thu", score: 0.72, level: "High",     sessions: 5 },
  { date: "Fri", score: 0.68, level: "High",     sessions: 4 },
  { date: "Sat", score: 0.42, level: "Moderate", sessions: 3 },
  { date: "Sun", score: 0.28, level: "Low",      sessions: 2 },
];

function History() {
  const [tab, setTab] = useState("daily");
  const avg = (HISTORY_DATA.reduce((a, d) => a + d.score, 0) / HISTORY_DATA.length);

  return (
    <div>
      <div className="flex-between mb-24">
        <div className="section-title" style={{ marginBottom: 0 }}>History & Trends</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["daily","weekly"].map(t => (
            <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "8px 18px", fontSize: 13, textTransform: "capitalize" }}
              onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="grid-3 mb-16">
        {[
          { label: "Avg Stress", val: `${Math.round(avg * 100)}%`, col: stressColor(avg), icon: "📊" },
          { label: "Best Day",   val: "Sunday",                    col: C.low,            icon: "🌟" },
          { label: "Sessions",   val: "23",                        col: C.blue,           icon: "🔥" },
        ].map(s => (
          <div key={s.label} className="card card-sm" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.col }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.txt2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-16">
        <div className="section-title">Stress Levels This Week</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "0 8px" }}>
          {HISTORY_DATA.map(d => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${d.score * 120}px`, background: stressColor(d.score),
                            borderRadius: "4px 4px 0 0", opacity: .85, transition: "height .4s" }} />
              <div style={{ fontSize: 11, color: C.txt2 }}>{d.date}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.low, fontWeight: 600, marginTop: 12, textAlign: "center" }}>
          📉 Stress down 18% this week — great progress!
        </div>
      </div>

      <div className="card">
        <div className="section-title">Session Log</div>
        <table className="data-table">
          <thead>
            <tr><th>Day</th><th>Avg Score</th><th>Level</th><th>Sessions</th></tr>
          </thead>
          <tbody>
            {HISTORY_DATA.map(d => (
              <tr key={d.date}>
                <td style={{ fontWeight: 600 }}>{d.date}</td>
                <td style={{ fontFamily: "'DM Mono',monospace", color: stressColor(d.score) }}>{d.score.toFixed(2)}</td>
                <td><span className={`badge badge-${d.score < .3 ? "low" : d.score < .6 ? "mod" : "high"}`}>{d.level}</span></td>
                <td>{d.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function Settings({ user }) {
  const [thresh,   setThresh]   = useState(0.65);
  const [notifs,   setNotifs]   = useState(true);
  const [music,    setMusic]    = useState(true);
  const [aroma,    setAroma]    = useState(false);
  const [daily,    setDaily]    = useState(true);

  return (
    <div>
      <div className="section-title">Settings</div>
      <div style={{ maxWidth: 680 }}>

        {/* Profile */}
        <div className="card mb-16" style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.blueDk})`, color: "#fff" }}>
          <div className="flex-row">
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.2)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 13, opacity: .8 }}>{user?.email || "user@example.com"}</div>
            </div>
          </div>
        </div>

        {/* Device */}
        <div className="card mb-16">
          <div style={{ fontWeight: 700, fontSize: 13, color: C.txt2, textTransform: "uppercase",
                        letterSpacing: ".05em", marginBottom: 12 }}>Device</div>
          <div className="flex-between">
            <div className="flex-row">
              <span style={{ fontSize: 20 }}>📡</span>
              <div>
                <div style={{ fontWeight: 600 }}>NeuroSense Pro</div>
                <div style={{ fontSize: 12, color: C.low }}>● Connected · Battery 87%</div>
              </div>
            </div>
            <button className="btn btn-danger" style={{ padding: "8px 14px", fontSize: 12 }}>Disconnect</button>
          </div>
          <button className="btn btn-ghost btn-full mt-12" style={{ fontSize: 13 }}>📶 Scan for new devices</button>
        </div>

        {/* Threshold */}
        <div className="card mb-16">
          <div style={{ fontWeight: 700, fontSize: 13, color: C.txt2, textTransform: "uppercase",
                        letterSpacing: ".05em", marginBottom: 12 }}>Stress Threshold</div>
          <div className="flex-between mb-8">
            <span style={{ fontSize: 14 }}>Alert Threshold</span>
            <span style={{ fontWeight: 700, color: C.blue, fontFamily: "'DM Mono',monospace" }}>{thresh.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={thresh}
            onChange={e => setThresh(+e.target.value)}
            style={{ width: "100%", accentColor: stressColor(thresh) }} />
          <div className="flex-between mt-8" style={{ fontSize: 11, color: C.txt2 }}>
            <span>Low (0.00)</span><span>Moderate</span><span>High (1.00)</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="card mb-16">
          <div style={{ fontWeight: 700, fontSize: 13, color: C.txt2, textTransform: "uppercase",
                        letterSpacing: ".05em", marginBottom: 4 }}>Notifications</div>
          {[
            { label: "High Stress Alerts", sub: "Alert when threshold exceeded", val: notifs, set: setNotifs },
            { label: "Daily Summary",      sub: "End-of-day stress report",       val: daily,  set: setDaily },
          ].map(n => (
            <div key={n.label} className="toggle-wrap">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.label}</div>
                <div style={{ fontSize: 12, color: C.txt2 }}>{n.sub}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={n.val} onChange={e => n.set(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>

        {/* Sensory */}
        <div className="card mb-16">
          <div style={{ fontWeight: 700, fontSize: 13, color: C.txt2, textTransform: "uppercase",
                        letterSpacing: ".05em", marginBottom: 4 }}>Sensory Preferences</div>
          {[
            { label: "Enable Calming Music", sub: "Binaural beats on high stress", val: music, set: setMusic },
            { label: "Enable Aromatherapy",  sub: "Trigger aroma diffuser",         val: aroma, set: setAroma },
          ].map(s => (
            <div key={s.label} className="toggle-wrap">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.txt2 }}>{s.sub}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={s.val} onChange={e => s.set(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>

        <button className="btn btn-danger btn-full">🚪 Logout</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "details",  icon: "📊", label: "Details" },
  { id: "history",  icon: "🕐", label: "History" },
  { id: "chat",     icon: "🧠", label: "Check-In" },
  { id: "music",    icon: "🎵", label: "Music" },
  { id: "relax",    icon: "😮‍💨", label: "Relax" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function App() {
  const [user,        setUser]        = useState(null);
  const [page,        setPage]        = useState("home");
  const [stressScore, setStressScore] = useState(0.38);

  if (!user) return (
    <>
      <style>{STYLE}</style>
      <Login onLogin={setUser} />
    </>
  );

  return (
    <>
      <style>{STYLE}</style>
      <div className="app-wrap">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">❤️</div>
            <div>
              <div className="sidebar-logo-text">StressApp</div>
              <div className="sidebar-logo-sub">ECS_12 · KIIT</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`}
                onClick={() => setPage(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div>{user?.email || "user@example.com"}</div>
            <div style={{ marginTop: 4, cursor: "pointer", color: C.high }}
              onClick={() => setUser(null)}>Logout</div>
          </div>
        </aside>

        <main className="main">
          {page === "home"     && <Home stressScore={stressScore} setStressScore={setStressScore} setPage={setPage} />}
          {page === "details"  && <Details stressScore={stressScore} />}
          {page === "history"  && <History />}
          {page === "chat"     && <Chat onScore={s => { setStressScore(s); }} />}
          {page === "music"    && <Music />}
          {page === "relax"    && <Relax />}
          {page === "settings" && <Settings user={user} />}
        </main>
      </div>
    </>
  );
}