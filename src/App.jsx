import { useState, useEffect, useRef, useCallback } from "react";

const PALETTE = {
  sand: "#F7F0E3", teal: "#0D7377", tealLight: "#14A0A5",
  tealDark: "#085054", coral: "#E8604C", gold: "#D4A843",
  dark: "#1A2B2C", muted: "#6B8C8E", white: "#FFFFFF",
  cardBg: "#FFFFFF", bg: "#F2EAD8",
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtDate = (s) => { if (!s) return ""; try { return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return s; } };
const todayStr = () => new Date().toISOString().split("T")[0];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const CATEGORIES = ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"];
const PLATFORMS = ["Airbnb","VRBO","Direct","Other"];

const CAT_ICONS = {
  Cleaning: "🧹", Maintenance: "🔧", Supplies: "🛒",
  Utilities: "💡", Mortgage: "🏦", Insurance: "🛡️",
  Marketing: "📣", Other: "📦",
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = "currentColor" }) => {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    income: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    expenses: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    ai: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    scan: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />,
    chevronL: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />,
    chevronR: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />,
    pdf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} style={{ display: "block" }}>
      {icons[name]}
    </svg>
  );
};

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: "1.5px solid #E8E0D0", fontSize: 16,
  fontFamily: "inherit", background: "#FAFAF8", color: "#1A2B2C", outline: "none",
};

const LabelRow = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "#6B8C8E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const Btn = ({ children, onClick, color, small, disabled, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#E0E0E0" : outline ? "transparent" : (color || PALETTE.teal),
    color: disabled ? "#999" : outline ? (color || PALETTE.teal) : "#fff",
    border: outline ? `2px solid ${color || PALETTE.teal}` : "none",
    borderRadius: 12, padding: small ? "8px 16px" : "13px 22px",
    fontSize: small ? 13 : 15, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", letterSpacing: 0.3,
    boxShadow: disabled || outline ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
  }}>{children}</button>
);

// ── Swipeable row ─────────────────────────────────────────────────────────────
function SwipeRow({ children, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const startX = useRef(null);
  const startOffset = useRef(0);
  const SWIPE = 80;
  const CONFIRM_W = 160;

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startOffset.current = offset;
  };
  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const next = startOffset.current + dx;
    const max = confirm ? -CONFIRM_W : -SWIPE;
    setOffset(Math.min(0, Math.max(next, max)));
  };
  const onTouchEnd = () => {
    if (confirm) {
      setOffset(offset < -CONFIRM_W * 0.3 ? -CONFIRM_W : 0);
      if (offset >= -CONFIRM_W * 0.3) setConfirm(false);
    } else {
      setOffset(offset < -SWIPE * 0.5 ? -SWIPE : 0);
    }
    startX.current = null;
  };

  const handleTrashClick = () => {
    setConfirm(true);
    setOffset(-CONFIRM_W);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirm(false);
    setOffset(0);
  };

  return (
    <div style={{ position: "relative", marginBottom: 10, borderRadius: 16, overflow: "hidden" }}>
      {/* Delete background */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: confirm ? CONFIRM_W : SWIPE, background: confirm ? "#C0392B" : PALETTE.coral, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: "0 16px 16px 0", transition: "width 0.2s, background 0.2s", padding: "0 8px" }}>
        {confirm ? (
          <>
            <button onClick={handleConfirmDelete} style={{ background: "#fff", color: "#C0392B", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Xóa</button>
            <button onClick={handleCancel} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
          </>
        ) : (
          <div onClick={handleTrashClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
            <Icon name="trash" size={20} color="#fff" />
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>Xóa</span>
          </div>
        )}
      </div>
      {/* Swipeable card */}
      <div
        style={{ transform: `translateX(${offset}px)`, transition: startX.current ? "none" : "transform 0.25s ease", position: "relative", zIndex: 1 }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// ── Bill Scanner ──────────────────────────────────────────────────────────────
function BillScanner({ onParsed, onCancel }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | parsing | done
  const [preview, setPreview] = useState(null);
  const [driveUrl, setDriveUrl] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      const filename = `bill-${new Date().toISOString().slice(0,10)}-${Date.now()}.jpg`;
      setPreview(ev.target.result);

      // Step 1: Upload to Google Drive
      setStatus("uploading");
      let url = null;
      try {
        const uploadRes = await fetch("/api/upload-bill", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType, filename }),
        });
        const uploadData = await uploadRes.json();
        url = uploadData.url;
        setDriveUrl(url);
      } catch { }

      // Step 2: Parse with AI
      setStatus("parsing");
      try {
        const parseRes = await fetch("/api/parse-bill", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });
        const parsed = await parseRes.json();
        setStatus("done");
        onParsed({ ...parsed, driveUrl: url });
      } catch {
        alert("Không đọc được bill. Thử lại!");
        setStatus("idle");
      }
    };
    reader.readAsDataURL(file);
  };

  const statusText = {
    idle: null,
    uploading: "☁️ Đang lưu lên Google Drive...",
    parsing: "🤖 AI đang đọc bill...",
    done: "✅ Xong!",
  };

  // Auto-open file picker on mount
  useEffect(() => {
    if (fileRef.current) fileRef.current.click();
  }, []);

  return (
    <div style={{ background: "#F0F9F9", borderRadius: 16, padding: 20, marginBottom: 14, textAlign: "center", border: `2px dashed ${PALETTE.teal}` }}>
      {status === "idle" && !preview && (
        <>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
          <div style={{ fontSize: 14, color: PALETTE.muted, marginBottom: 14 }}>Chụp hoặc chọn ảnh từ thư viện</div>
          <Btn onClick={onCancel} color={PALETTE.muted} outline small>Hủy</Btn>
        </>
      )}
      {preview && <img src={preview} style={{ width: "100%", borderRadius: 12, marginBottom: 14, maxHeight: 180, objectFit: "cover" }} />}
      {driveUrl && <div style={{ fontSize: 11, color: PALETTE.teal, marginBottom: 10 }}>✅ Đã lưu Google Drive</div>}
      {status !== "idle" && (
        <div style={{ color: PALETTE.teal, fontWeight: 600, fontSize: 14 }}>{statusText[status]}</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ── Expense Form ──────────────────────────────────────────────────────────────
function ExpenseForm({ onSave, onCancel, saving }) {
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState("Cleaning");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [by, setBy] = useState("Harry");
  const [showScanner, setShowScanner] = useState(false);

  const handleParsed = (data) => {
    if (data.date) setDate(data.date);
    if (data.category) setCategory(data.category);
    if (data.amount) setAmount(String(data.amount));
    if (data.note) setNote(data.note);
    setShowScanner(false);
  };

  return (
    <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      {showScanner && <BillScanner onParsed={handleParsed} onCancel={() => setShowScanner(false)} />}
      {!showScanner && <>
        <button onClick={() => setShowScanner(true)} style={{ width: "100%", background: "#F0F9F9", border: `1.5px dashed ${PALETTE.teal}`, borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: PALETTE.teal, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Icon name="scan" size={16} color={PALETTE.teal} /> Scan Bill với AI
        </button>
        <LabelRow label="Date"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></LabelRow>
        <LabelRow label="Category">
          <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
        </LabelRow>
        <LabelRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" /></LabelRow>
        <LabelRow label="Note"><input type="text" style={inputStyle} placeholder="Description..." value={note} onChange={e => setNote(e.target.value)} /></LabelRow>
        <LabelRow label="Paid by">
          <select style={inputStyle} value={by} onChange={e => setBy(e.target.value)}>
            {["Harry", "Lily", "Cindy"].map(n => <option key={n}>{n}</option>)}
          </select>
        </LabelRow>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => { if (!amount || isNaN(amount)) return; onSave({ date, category, amount: parseFloat(amount), note, by }); }} disabled={saving}>{saving ? "Saving..." : "Save Expense"}</Btn>
          <Btn onClick={onCancel} color={PALETTE.muted} outline small>Cancel</Btn>
        </div>
      </>}
    </div>
  );
}

// ── Income Form ───────────────────────────────────────────────────────────────
function IncomeForm({ onSave, onCancel, saving }) {
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState("");
  const [nights, setNights] = useState("");
  const [guest, setGuest] = useState("");
  const [platform, setPlatform] = useState("Airbnb");
  return (
    <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <LabelRow label="Check-in Date"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></LabelRow>
      <LabelRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" /></LabelRow>
      <LabelRow label="Nights"><input type="number" style={inputStyle} placeholder="1" value={nights} onChange={e => setNights(e.target.value)} inputMode="numeric" /></LabelRow>
      <LabelRow label="Guest Name"><input type="text" style={inputStyle} placeholder="Guest name" value={guest} onChange={e => setGuest(e.target.value)} /></LabelRow>
      <LabelRow label="Platform">
        <select style={inputStyle} value={platform} onChange={e => setPlatform(e.target.value)}>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </LabelRow>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => { if (!amount || isNaN(amount)) return; onSave({ date, amount: parseFloat(amount), nights: parseInt(nights) || 1, guest, platform }); }} disabled={saving}>{saving ? "Saving..." : "Save Income"}</Btn>
        <Btn onClick={onCancel} color={PALETTE.muted} outline small>Cancel</Btn>
      </div>
    </div>
  );
}

// ── iCal ─────────────────────────────────────────────────────────────────────
function parseIcal(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const get = (k) => { const m = b.match(new RegExp(`${k}[^:]*:([^\r\n]+)`)); return m ? m[1].trim() : ""; };
    const pd = (s) => { if (!s) return null; const c = s.replace(/T.*/, ""); return c.length === 8 ? `${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}` : null; };
    const dtstart = pd(get("DTSTART")), dtend = pd(get("DTEND"));
    if (dtstart) events.push({ summary: get("SUMMARY") || "Booked", dtstart, dtend, nights: dtstart && dtend ? Math.round((new Date(dtend) - new Date(dtstart)) / 86400000) : 0 });
  }
  return events.sort((a, b) => a.dtstart > b.dtstart ? 1 : -1);
}

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function isBooked(d, evs) { return evs.some(e => e.dtstart <= d && (e.dtend ? d < e.dtend : false)); }
function getEv(d, evs) { return evs.find(e => e.dtstart <= d && (e.dtend ? d < e.dtend : false)); }

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = PALETTE.teal }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ opacity: 0.8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF(month, year, expenses, income) {
  const fE = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; });
  const fI = income.filter(r => { const d = new Date(r.date); return d.getMonth() === month && d.getFullYear() === year; });
  const tI = fI.reduce((s, r) => s + r.amount, 0);
  const tE = fE.reduce((s, e) => s + e.amount, 0);
  const net = tI - tE, cindy = Math.max(0, net * 0.3), owners = net - cindy;
  const f2 = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Georgia,serif;padding:40px;color:#1A2B2C;max-width:700px;margin:0 auto;}
h1{color:#0D7377;font-size:28px;} .sub{color:#6B8C8E;font-size:14px;margin-bottom:30px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
.card{background:#f5f5f5;border-radius:10px;padding:16px;border-left:4px solid #0D7377;}
.card.red{border-left-color:#E8604C;} .card.gold{border-left-color:#D4A843;} .card.dark{border-left-color:#085054;}
.card-label{font-size:11px;color:#6B8C8E;text-transform:uppercase;letter-spacing:1px;}
.card-value{font-size:24px;font-weight:700;margin-top:4px;}
h2{color:#0D7377;font-size:16px;border-bottom:2px solid #0D7377;padding-bottom:6px;margin-bottom:12px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{background:#0D7377;color:#fff;padding:8px 10px;text-align:left;}
td{padding:7px 10px;border-bottom:1px solid #eee;}
tr:nth-child(even) td{background:#f9f9f9;}
.footer{margin-top:40px;font-size:11px;color:#6B8C8E;text-align:center;}
</style></head><body>
<h1>🌴 Poolside Paradise</h1>
<div class="sub">Monthly Report — ${MONTH_NAMES[month]} ${year}</div>
<div class="grid">
<div class="card"><div class="card-label">Total Income</div><div class="card-value">${f2(tI)}</div></div>
<div class="card red"><div class="card-label">Total Expenses</div><div class="card-value">${f2(tE)}</div></div>
<div class="card dark"><div class="card-label">Net Profit</div><div class="card-value">${f2(net)}</div></div>
<div class="card gold"><div class="card-label">Cindy (30%)</div><div class="card-value">${f2(cindy)}</div></div>
</div>
<h2>Settlement</h2>
<table><tr><th>Person</th><th>Share</th><th>Amount</th></tr>
<tr><td>Harry & Lily</td><td>70%</td><td>${f2(owners)}</td></tr>
<tr><td>Cindy</td><td>30%</td><td>${f2(cindy)}</td></tr></table><br/>
<h2>Income (${fI.length} bookings)</h2>
<table><tr><th>Date</th><th>Guest</th><th>Nights</th><th>Platform</th><th>Amount</th></tr>
${fI.map(r => `<tr><td>${r.date}</td><td>${r.guest || "—"}</td><td>${r.nights}</td><td>${r.platform}</td><td>${f2(r.amount)}</td></tr>`).join("")}
<tr><td colspan="4"><strong>Total</strong></td><td><strong>${f2(tI)}</strong></td></tr></table><br/>
<h2>Expenses (${fE.length} items)</h2>
<table><tr><th>Date</th><th>Category</th><th>Note</th><th>By</th><th>Amount</th></tr>
${fE.map(e => `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.note || "—"}</td><td>${e.by}</td><td>${f2(e.amount)}</td></tr>`).join("")}
<tr><td colspan="4"><strong>Total</strong></td><td><strong>${f2(tE)}</strong></td></tr></table>
<div class="footer">Generated by Poolside Paradise · ${new Date().toLocaleDateString()}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `report-${MONTH_NAMES[month]}-${year}.html`;
  a.click();
}


// ── CSV Importer ──────────────────────────────────────────────────────────────
function ImportCSV({ onImported, onCancel }) {
  const [status, setStatus] = useState("idle"); // idle | importing | done | error
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus("importing");
    const text = await file.text();
    try {
      const r = await fetch("/api/import-csv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStatus("done");
      if (data.records?.length > 0) onImported(data.records);
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div style={{ background: "#F0F9F9", borderRadius: 16, padding: 20, marginBottom: 14, border: `2px dashed ${PALETTE.teal}` }}>
      <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>📊</div>
      <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Import từ Airbnb CSV</div>
      <div style={{ fontSize: 12, color: PALETTE.muted, textAlign: "center", marginBottom: 16 }}>Download file CSV từ Airbnb → Upload vào đây</div>

      {status === "idle" && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={() => fileRef.current.click()}>📂 Chọn file CSV</Btn>
          <Btn onClick={onCancel} color={PALETTE.muted} outline small>Hủy</Btn>
        </div>
      )}
      {status === "importing" && <div style={{ textAlign: "center", color: PALETTE.teal, fontWeight: 600 }}>⏳ Đang import...</div>}
      {status === "done" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 700, color: PALETTE.teal }}>Import thành công!</div>
          <div style={{ fontSize: 13, color: PALETTE.muted, margin: "6px 0 14px" }}>
            ✅ Đã thêm: <b style={{color: PALETTE.teal}}>{result?.imported}</b> bookings
            {result?.skipped > 0 && <span> · ⏭️ Bỏ qua: <b style={{color: PALETTE.gold}}>{result?.skipped}</b> trùng lặp</span>}
          </div>
          <Btn onClick={onCancel} small>Đóng</Btn>
        </div>
      )}
      {status === "error" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: PALETTE.coral, marginBottom: 10 }}>❌ Lỗi import. Thử lại!</div>
          <Btn onClick={() => setStatus("idle")} small>Thử lại</Btn>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ── API ───────────────────────────────────────────────────────────────────────
const api = async (action, body) => {
  const r = await fetch(`/api/baserow?action=${action}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { method: "GET" });
  return r.json();
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMode, setFilterMode] = useState("month");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAttachment, setAiAttachment] = useState(null); // {base64, mediaType, name, preview}
  const aiFileRef = useRef();
  const [aiHistory, setAiHistory] = useState([]);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [icalEvents, setIcalEvents] = useState([]);
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalError, setIcalError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    Promise.all([api("get_expenses"), api("get_income")])
      .then(([exp, inc]) => { setExpenses(Array.isArray(exp) ? exp : []); setIncome(Array.isArray(inc) ? inc : []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab === "calendar" && icalEvents.length === 0 && !icalLoading) fetchIcal(); }, [tab]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiHistory]);

  const filtered = (arr) => {
    if (filterMode === "all") return arr;
    if (filterMode === "year") return arr.filter(x => new Date(x.date).getFullYear() === filterYear);
    return arr.filter(x => { const d = new Date(x.date); return d.getMonth() === filterMonth && d.getFullYear() === filterYear; });
  };

  const fExp = filtered(expenses), fInc = filtered(income);
  const totalIncome = fInc.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = fExp.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const cindyShare = Math.max(0, netProfit * 0.3);
  const ownerShare = netProfit - cindyShare;
  const catBreakdown = CATEGORIES.map(c => ({ cat: c, total: fExp.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0);

  // Sparkline: last 6 months income
  const sparkData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return income.filter(r => { const rd = new Date(r.date); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); }).reduce((s, r) => s + r.amount, 0);
  });

  const fetchIcal = async () => {
    setIcalLoading(true); setIcalError("");
    try { const r = await fetch("/api/ical"); setIcalEvents(parseIcal(await r.text())); }
    catch { setIcalError("Không thể tải lịch."); }
    setIcalLoading(false);
  };

  const handleAddExpense = useCallback(async (data) => {
    setSaving(true);
    try { const s = await api("add_expense", data); setExpenses(prev => [...prev, { ...data, id: s.id || Date.now() }]); setShowExpForm(false); }
    catch { } setSaving(false);
  }, []);

  const handleAddIncome = useCallback(async (data) => {
    setSaving(true);
    try { const s = await api("add_income", data); setIncome(prev => [...prev, { ...data, id: s.id || Date.now() }]); setShowIncForm(false); }
    catch { } setSaving(false);
  }, []);

  const handleDelExpense = async (id) => { setExpenses(prev => prev.filter(x => x.id !== id)); await api("del_expense", { id }); };
  const handleDelIncome = async (id) => { setIncome(prev => prev.filter(x => x.id !== id)); await api("del_income", { id }); };

  const cancelExp = useCallback(() => setShowExpForm(false), []);
  const cancelInc = useCallback(() => setShowIncForm(false), []);

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = aiQuery; setAiQuery(""); setAiLoading(true);
    let qMonth = filterMonth, qYear = filterYear, qMode = filterMode;
    const match = userMsg.match(/tháng\s*(\d{1,2})|month\s*(\d{1,2})/i);
    if (match) { const m = parseInt(match[1] || match[2]) - 1; if (m >= 0 && m <= 11) { qMonth = m; qMode = "month"; setFilterMonth(m); setFilterMode("month"); } }
    const qE = qMode === "all" ? expenses : expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === qMonth && d.getFullYear() === qYear; });
    const qI = qMode === "all" ? income : income.filter(r => { const d = new Date(r.date); return d.getMonth() === qMonth && d.getFullYear() === qYear; });
    const qTI = qI.reduce((s, r) => s + r.amount, 0), qTE = qE.reduce((s, e) => s + e.amount, 0);
    const qNet = qTI - qTE, qCindy = Math.max(0, qNet * 0.3), qOwners = qNet - qCindy;
    const newHistory = [...aiHistory, { role: "user", content: userMsg }];
    setAiHistory(newHistory);
    const context = `Financial assistant for "Poolside Paradise" Airbnb. Owners: Harry & Lily. Partner: Cindy (30%). Period: ${qMode === "all" ? "All time" : `${MONTH_NAMES[qMonth]} ${qYear}`}. Income: ${fmt(qTI)} | Expenses: ${fmt(qTE)} | Profit: ${fmt(qNet)} | Cindy: ${fmt(qCindy)} | Owners: ${fmt(qOwners)}. Bookings: ${JSON.stringify(qI)}. Expenses: ${JSON.stringify(qE)}. Reply in same language as user.`;
    // Detect intent before calling AI for optimistic update
    const isAddExpense = /thêm|add|thêm vào|chi phí|expense|cleaning|maintenance|supplies|utilities|mortgage|insurance|marketing/i.test(userMsg) && /\d+/.test(userMsg) && !/income|thu nhập|booking|khách|guest/i.test(userMsg);
    const isAddIncome = /thêm|add|income|thu nhập|booking|khách|guest/i.test(userMsg) && /\d+/.test(userMsg);

    // Optimistic temp ID
    const tempId = `temp-${Date.now()}`;

    // Build message content with optional attachment
    const userContent = aiAttachment
      ? [
          { type: "image", source: { type: "base64", media_type: aiAttachment.mediaType, data: aiAttachment.base64 } },
          { type: "text", text: userMsg }
        ]
      : userMsg;
    const newHistoryWithAttach = [...aiHistory, { role: "user", content: userContent }];
    setAiAttachment(null);

    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: context, messages: newHistoryWithAttach }) });
      const d = await r.json();
      const reply = d.content?.find(b => b.type === "text")?.text || "Lỗi";
      setAiHistory([...newHistoryWithAttach, { role: "assistant", content: reply }]);

      // If AI added data
      if (d.action?.result?.success) {
        const { tool, result, input } = d.action;
        if (tool === "add_expense") {
          setExpenses(prev => [...prev.filter(x => x.id !== tempId), { ...input, id: result.id }]);
        } else if (tool === "add_multiple_expenses" && result.records) {
          setExpenses(prev => [...prev, ...result.records]);
        } else if (tool === "add_income") {
          setIncome(prev => [...prev.filter(x => x.id !== tempId), { ...input, id: result.id, nights: input.nights || 1, guest: input.guest || "", platform: input.platform || "Airbnb" }]);
        }
      }
    } catch (e) {
      // Remove optimistic item on error
      setExpenses(prev => prev.filter(x => x.id !== tempId));
      setIncome(prev => prev.filter(x => x.id !== tempId));
      setAiHistory([...newHistory, { role: "assistant", content: "Lỗi: " + e.message }]);
    }
    setAiLoading(false);
  };

  // ── Month Bar ───────────────────────────────────────────────────────────────
  const MonthBar = () => {
    const years = [...new Set([...expenses, ...income].map(x => new Date(x.date).getFullYear()))].sort((a,b) => b-a);
    if (!years.includes(filterYear)) years.push(filterYear);

    return (
      <div style={{ marginBottom: 16 }}>
        {/* Quick buttons */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
          <button onClick={() => { setFilterMode("month"); setFilterMonth(now.getMonth()); setFilterYear(now.getFullYear()); }}
            style={{ background: filterMode==="month" && filterMonth===now.getMonth() && filterYear===now.getFullYear() ? PALETTE.teal : "#EEF4F4", color: filterMode==="month" && filterMonth===now.getMonth() && filterYear===now.getFullYear() ? "#fff" : PALETTE.muted, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
            Tháng này
          </button>
          <button onClick={() => { const last = now.getMonth()===0?11:now.getMonth()-1; const y = now.getMonth()===0?now.getFullYear()-1:now.getFullYear(); setFilterMode("month"); setFilterMonth(last); setFilterYear(y); }}
            style={{ background: PALETTE.muted==="month"?"#EEF4F4":"#EEF4F4", color: PALETTE.muted, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
            Tháng trước
          </button>
          {years.map(y => (
            <button key={y} onClick={() => { setFilterMode("year"); setFilterYear(y); }}
              style={{ background: filterMode==="year" && filterYear===y ? PALETTE.tealDark : "#EEF4F4", color: filterMode==="year" && filterYear===y ? "#fff" : PALETTE.muted, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              {y}
            </button>
          ))}
          <button onClick={() => setFilterMode("all")}
            style={{ background: filterMode==="all" ? PALETTE.gold : "#EEF4F4", color: filterMode==="all" ? "#fff" : PALETTE.muted, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
            Tất cả
          </button>
        </div>

        {/* Month navigator — only show in month mode */}
        {filterMode === "month" && (
          <div style={{ position:"relative" }}>
            <div style={{ background: PALETTE.cardBg, borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <button onClick={() => { if (filterMonth===0){setFilterMonth(11);setFilterYear(y=>y-1);}else setFilterMonth(m=>m-1); }} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}>
                <Icon name="chevronL" size={18} color={PALETTE.teal} />
              </button>
              <div onClick={() => setShowMonthPicker(v=>!v)} style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:15, color:PALETTE.teal, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {MONTH_NAMES[filterMonth]} {filterYear}
                <span style={{ fontSize:10, opacity:0.7 }}>▼</span>
              </div>
              <button onClick={() => { if (filterMonth===11){setFilterMonth(0);setFilterYear(y=>y+1);}else setFilterMonth(m=>m+1); }} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}>
                <Icon name="chevronR" size={18} color={PALETTE.teal} />
              </button>
              <button onClick={() => generatePDF(filterMonth, filterYear, expenses, income)} style={{ background:PALETTE.coral,color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                <Icon name="pdf" size={13} color="#fff"/> PDF
              </button>
            </div>

            {/* Month Picker Popup */}
            {showMonthPicker && (
              <>
              <div onClick={() => setShowMonthPicker(false)} style={{ position:"fixed", inset:0, zIndex:199 }} />
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:200, background:"#fff", borderRadius:16, padding:16, boxShadow:"0 8px 30px rgba(0,0,0,0.15)", marginTop:6 }}>
                {/* Year selector */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <button onClick={() => setFilterYear(y=>y-1)} style={{ background:"#EEF4F4",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,color:PALETTE.teal }}>‹</button>
                  <div style={{ fontWeight:700, fontSize:16, color:PALETTE.dark }}>{filterYear}</div>
                  <button onClick={() => setFilterYear(y=>y+1)} style={{ background:"#EEF4F4",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,color:PALETTE.teal }}>›</button>
                </div>
                {/* Month grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                  {MONTH_NAMES.map((m,i) => (
                    <button key={m} onClick={() => { setFilterMonth(i); setFilterMode("month"); setShowMonthPicker(false); }}
                      style={{ background: filterMonth===i && filterYear===filterYear ? PALETTE.teal : "#F5F5F5", color: filterMonth===i ? "#fff" : PALETTE.dark, border:"none", borderRadius:10, padding:"8px 4px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      {m.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* Year mode label */}
        {filterMode === "year" && (
          <div style={{ background: PALETTE.cardBg, borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:700, fontSize:15, color:PALETTE.dark }}>Năm {filterYear}</div>
            <button onClick={() => generatePDF(filterMonth, filterYear, expenses, income)} style={{ background:PALETTE.coral,color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
              <Icon name="pdf" size={13} color="#fff"/> PDF
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Calendar ────────────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const days = getDaysInMonth(calYear, calMonth), firstDay = getFirstDay(calYear, calMonth);
    const cells = []; for (let i = 0; i < firstDay; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
    const today = todayStr();
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} style={{ background: "#EEF4F4", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Icon name="chevronL" size={18} color={PALETTE.teal} /></button>
          <div style={{ fontWeight: 700, fontSize: 17, color: PALETTE.dark }}>{MONTH_NAMES[calMonth]} {calYear}</div>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} style={{ background: "#EEF4F4", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Icon name="chevronR" size={18} color={PALETTE.teal} /></button>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, fontSize: 11, color: PALETTE.muted }}>
          {[["Booked", PALETTE.coral], ["Available", "#C8E6C9"], ["Today", PALETTE.tealLight]].map(([l, c]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: c, borderRadius: 3, display: "inline-block" }} />{l}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
          {DAY_NAMES.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: PALETTE.muted, fontWeight: 600, padding: "4px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const booked = isBooked(ds, icalEvents), isToday = ds === today, ev = getEv(ds, icalEvents);
            return <div key={d} onClick={() => ev && setSelectedEvent(ev)} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, fontSize: 13, fontWeight: isToday ? 700 : 400, cursor: ev ? "pointer" : "default", background: isToday ? PALETTE.tealLight : booked ? PALETTE.coral : "#E8F5E9", color: (isToday || booked) ? "#fff" : PALETTE.dark, boxShadow: isToday ? `0 2px 8px ${PALETTE.tealLight}66` : "none" }}>{d}</div>;
          })}
        </div>
        {selectedEvent && (
          <div style={{ marginTop: 16, background: "#FFF0EE", borderRadius: 14, padding: 14, border: `2px solid ${PALETTE.coral}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, color: PALETTE.coral }}>📅 {selectedEvent.summary}</div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: PALETTE.muted, marginTop: 8, lineHeight: 1.8 }}>
              Check-in: <b style={{ color: PALETTE.dark }}>{fmtDate(selectedEvent.dtstart)}</b><br />
              Check-out: <b style={{ color: PALETTE.dark }}>{fmtDate(selectedEvent.dtend)}</b><br />
              Số đêm: <b style={{ color: PALETTE.dark }}>{selectedEvent.nights}</b>
            </div>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: PALETTE.dark }}>Upcoming Bookings</div>
          {icalEvents.filter(e => e.dtend >= today).slice(0, 8).map((e, i) => (
            <div key={i} style={{ background: PALETTE.cardBg, borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.summary}</div>
                <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>{fmtDate(e.dtstart)} → {fmtDate(e.dtend)}</div>
              </div>
              <div style={{ background: PALETTE.coral, color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{e.nights}n</div>
            </div>
          ))}
          {icalEvents.filter(e => e.dtend >= today).length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: PALETTE.muted, fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>No upcoming bookings
            </div>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "dashboard", icon: "home", label: "Home" },
    { id: "calendar", icon: "calendar", label: "Calendar" },
    { id: "income", icon: "income", label: "Income" },
    { id: "expenses", icon: "expenses", label: "Expenses" },
    { id: "ai", icon: "ai", label: "AI" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🌴</div>
      <div style={{ color: PALETTE.teal, fontWeight: 700, fontSize: 18 }}>Poolside Paradise</div>
      <div style={{ color: PALETTE.muted, fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: PALETTE.dark, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${PALETTE.tealDark} 0%, ${PALETTE.teal} 100%)`, padding: "40px 20px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>Property Management</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>🌴 Poolside Paradise</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{filterMode === "all" ? "All time" : `${MONTH_NAMES[filterMonth]} ${filterYear}`}</div>
      </div>

      <div style={{ padding: "18px 16px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <MonthBar />
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { label: "Total Income", value: fmt(totalIncome), sub: `${fInc.length} bookings`, color: PALETTE.teal, spark: sparkData },
                { label: "Expenses", value: fmt(totalExpenses), sub: `${fExp.length} items`, color: PALETTE.coral },
                { label: "Net Profit", value: fmt(netProfit), color: netProfit >= 0 ? PALETTE.tealDark : PALETTE.coral },
                { label: "Cindy 30%", value: fmt(cindyShare), sub: "Partner share", color: PALETTE.gold },
              ].map(({ label, value, sub, color, spark }) => (
                <div key={label} style={{ background: color, borderRadius: 20, padding: "16px 18px", color: "#fff", boxShadow: `0 4px 16px ${color}44` }}>
                  <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 2px", letterSpacing: -0.5 }}>{value}</div>
                  {sub && <div style={{ fontSize: 11, opacity: 0.8 }}>{sub}</div>}
                  {spark && <div style={{ marginTop: 8 }}><Sparkline data={spark} color="rgba(255,255,255,0.7)" /></div>}
                </div>
              ))}
            </div>

            {/* Owner Split */}
            <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Owner Split</div>
              {[["Harry & Lily", ownerShare, PALETTE.teal, "70%"], ["Cindy", cindyShare, PALETTE.gold, "30%"]].map(([n, v, c, pct]) => (
                <div key={n} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: PALETTE.muted }}>{n} <span style={{ background: "#eee", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{pct}</span></span>
                    <span style={{ fontWeight: 700, color: c }}>{fmt(v)}</span>
                  </div>
                  <div style={{ height: 6, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: pct, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Category Breakdown */}
            <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Expenses by Category</div>
              {catBreakdown.length === 0 && <div style={{ color: PALETTE.muted, fontSize: 13, textAlign: "center", padding: 16 }}>No expenses this period</div>}
              {catBreakdown.map(({ cat, total }) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 10 }}>
                  <div style={{ width: 36, height: 36, background: "#F0F9F9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{CAT_ICONS[cat]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: PALETTE.coral }}>{fmt(total)}</span>
                    </div>
                    <div style={{ height: 5, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((total / totalExpenses) * 100)}%`, height: "100%", background: PALETTE.coral, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Airbnb Calendar</div>
              <button onClick={fetchIcal} style={{ background: PALETTE.tealDark, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↻ Sync</button>
            </div>
            {icalLoading && <div style={{ textAlign: "center", padding: 50, color: PALETTE.muted }}><div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>Loading calendar...</div>}
            {icalError && <div style={{ background: "#FFF0EE", borderRadius: 14, padding: 14, color: PALETTE.coral, marginBottom: 14, fontSize: 13 }}>⚠️ {icalError}</div>}
            {!icalLoading && <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>{renderCalendar()}</div>}
          </div>
        )}

        {/* INCOME */}
        {tab === "income" && (
          <div>
            <MonthBar />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Income <span style={{ fontSize: 14, color: PALETTE.muted, fontWeight: 400 }}>{fmt(totalIncome)}</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowImportCSV(v => !v)} style={{ background: "#E8F5F5", color: PALETTE.teal, border: "none", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📊 CSV</button>
                <button onClick={() => setShowIncForm(v => !v)} style={{ background: PALETTE.teal, color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${PALETTE.teal}44` }}>+ Add</button>
              </div>
            </div>
            {showImportCSV && <ImportCSV onImported={(records) => { setIncome(prev => [...prev, ...records]); setShowImportCSV(false); }} onCancel={() => setShowImportCSV(false)} />}
            {showIncForm && <IncomeForm onSave={handleAddIncome} onCancel={cancelInc} saving={saving} />}
            {[...fInc].sort((a,b) => b.date.localeCompare(a.date)).map(r => (
              <SwipeRow key={r.id} onDelete={() => handleDelIncome(r.id)}>
                <div style={{ background: PALETTE.cardBg, borderRadius: 16, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: "#E8F5F5", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏡</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.guest || "Guest"}</div>
                      <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>{fmtDate(r.date)} · {r.nights}n · {r.platform}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: PALETTE.teal, fontSize: 16 }}>{fmt(r.amount)}</div>
                </div>
              </SwipeRow>
            ))}
            {fInc.length === 0 && <div style={{ textAlign: "center", padding: 40, color: PALETTE.muted }}><div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>No income this period</div>}
          </div>
        )}

        {/* EXPENSES */}
        {tab === "expenses" && (
          <div>
            <MonthBar />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Expenses <span style={{ fontSize: 14, color: PALETTE.muted, fontWeight: 400 }}>{fmt(totalExpenses)}</span></div>
              <button onClick={() => setShowExpForm(v => !v)} style={{ background: PALETTE.coral, color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${PALETTE.coral}44` }}>
                + Add
              </button>
            </div>
            {showExpForm && <ExpenseForm onSave={handleAddExpense} onCancel={cancelExp} saving={saving} />}
            {[...fExp].sort((a,b) => b.date.localeCompare(a.date)).map(e => (
              <SwipeRow key={e.id} onDelete={() => handleDelExpense(e.id)}>
                <div style={{ background: PALETTE.cardBg, borderRadius: 16, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: "#FFF0EE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{CAT_ICONS[e.category] || "📦"}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.category}</div>
                      <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>{fmtDate(e.date)} · {e.note || "—"} · {e.by}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: PALETTE.coral, fontSize: 16 }}>{fmt(e.amount)}</div>
                </div>
              </SwipeRow>
            ))}
            {fExp.length === 0 && <div style={{ textAlign: "center", padding: 40, color: PALETTE.muted }}><div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>No expenses this period</div>}
          </div>
        )}

        {/* AI */}
        {tab === "ai" && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>AI Assistant</div>
            <div style={{ fontSize: 13, color: PALETTE.muted, marginBottom: 14 }}>Hỏi về tài chính theo tháng — EN hoặc VI</div>
            <div style={{ background: PALETTE.cardBg, borderRadius: 20, padding: 16, minHeight: 340, maxHeight: 440, overflowY: "auto", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {aiHistory.length === 0 && (
                <div style={{ color: PALETTE.muted, fontSize: 13, textAlign: "center", marginTop: 60 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
                  <div>"Báo cáo tháng 6"</div>
                  <div style={{ marginTop: 4 }}>"Tháng 2 lợi nhuận bao nhiêu?"</div>
                </div>
              )}
              {aiHistory.map((m, i) => (
                <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ maxWidth: "82%", padding: "11px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? PALETTE.teal : "#F5F5F5", color: m.role === "user" ? "#fff" : PALETTE.dark, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>{m.content}</div>
                </div>
              ))}
              {aiLoading && <div style={{ color: PALETTE.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Đang trả lời...</div>}
              <div ref={chatEndRef} />
            </div>
            {/* Attachment preview */}
            {aiAttachment && (
              <div style={{ background: "#F0F9F9", borderRadius: 12, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                {aiAttachment.preview
                  ? <img src={aiAttachment.preview} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                  : <span style={{ fontSize: 24 }}>📄</span>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: PALETTE.dark }}>{aiAttachment.name}</div>
                  <div style={{ fontSize: 11, color: PALETTE.muted }}>Đính kèm vào tin nhắn tiếp theo</div>
                </div>
                <button onClick={() => setAiAttachment(null)} style={{ background: "none", border: "none", color: PALETTE.coral, cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => aiFileRef.current.click()} style={{ background: "#EEF4F4", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>📎</span>
              </button>
              <input style={{ ...inputStyle, flex: 1, borderRadius: 14, background: PALETTE.cardBg, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} placeholder="Hỏi gì đó..." value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} />
              <button onClick={askAI} style={{ background: PALETTE.teal, color: "#fff", border: "none", borderRadius: 14, padding: "0 18px", height: 48, fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${PALETTE.teal}44`, flexShrink: 0 }}>Gửi</button>
            </div>
            <input ref={aiFileRef} type="file" accept="image/*,.csv,.pdf" style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const base64 = ev.target.result.split(",")[1];
                const isImage = file.type.startsWith("image/");
                setAiAttachment({
                  base64,
                  mediaType: file.type || "image/jpeg",
                  name: file.name,
                  preview: isImage ? ev.target.result : null,
                  isImage,
                });
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }} />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: PALETTE.cardBg, borderTop: "1px solid #EEE8DC", display: "flex", justifyContent: "space-around", padding: "10px 0 16px", zIndex: 100, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 12px", color: tab === t.id ? PALETTE.teal : PALETTE.muted }}>
            <div style={{ padding: 6, background: tab === t.id ? "#E8F5F5" : "transparent", borderRadius: 12, transition: "background 0.2s" }}>
              <Icon name={t.icon} size={22} color={tab === t.id ? PALETTE.teal : PALETTE.muted} />
            </div>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
