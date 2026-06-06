import { useState, useEffect, useRef } from "react";

const PALETTE = {
  sand: "#F5EDD6", teal: "#0D7377", tealLight: "#14A0A5",
  tealDark: "#085054", coral: "#E8604C", gold: "#D4A843",
  dark: "#1A2B2C", muted: "#6B8C8E", white: "#FDFAF4",
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const today = () => new Date().toISOString().split("T")[0];

const ICAL_URL = "https://www.airbnb.com/calendar/ical/903771582100260470.ics?t=5c6e23eb6a3447e78667ed85879cda9a";
const PROXY = '/api/ical';

const INIT_EXPENSES = [
  { id: 1, date: "2025-06-01", category: "Cleaning", amount: 120, note: "Post-checkout deep clean", by: "Harry" },
  { id: 2, date: "2025-06-03", category: "Maintenance", amount: 85, note: "Pool pump repair", by: "Lily" },
  { id: 3, date: "2025-06-08", category: "Supplies", amount: 47, note: "Towels & toiletries", by: "Harry" },
];
const INIT_INCOME = [
  { id: 1, date: "2025-06-02", amount: 320, nights: 2, guest: "John D.", platform: "Airbnb" },
  { id: 2, date: "2025-06-06", amount: 640, nights: 4, guest: "Sarah M.", platform: "Airbnb" },
  { id: 3, date: "2025-06-12", amount: 480, nights: 3, guest: "Mike T.", platform: "VRBO" },
];

const CATEGORIES = ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"];
const PLATFORMS = ["Airbnb","VRBO","Direct","Other"];

// ── iCal parser ──────────────────────────────────────────────────────────────
function parseIcal(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const get = (key) => {
      const m = b.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return m ? m[1].trim() : "";
    };
    const parseDate = (s) => {
      if (!s) return null;
      const clean = s.replace(/T.*/, "");
      if (clean.length === 8) {
        return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
      }
      return null;
    };
    const summary = get("SUMMARY") || "Booked";
    const dtstart = parseDate(get("DTSTART"));
    const dtend = parseDate(get("DTEND"));
    if (dtstart) {
      // compute nights
      let nights = 0;
      if (dtstart && dtend) {
        const d1 = new Date(dtstart), d2 = new Date(dtend);
        nights = Math.round((d2 - d1) / 86400000);
      }
      events.push({ summary, dtstart, dtend, nights });
    }
  }
  return events.sort((a, b) => a.dtstart > b.dtstart ? 1 : -1);
}

// ── Calendar helpers ─────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
function isBooked(dateStr, events) {
  return events.some(e => e.dtstart <= dateStr && (e.dtend ? dateStr < e.dtend : false));
}
function getEventForDate(dateStr, events) {
  return events.find(e => e.dtstart <= dateStr && (e.dtend ? dateStr < e.dtend : false));
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState(INIT_EXPENSES);
  const [income, setIncome] = useState(INIT_INCOME);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);
  const [expForm, setExpForm] = useState({ date: today(), category: "Cleaning", amount: "", note: "", by: "Harry" });
  const [incForm, setIncForm] = useState({ date: today(), amount: "", nights: "", guest: "", platform: "Airbnb" });
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [icalEvents, setIcalEvents] = useState([]);
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalError, setIcalError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const chatEndRef = useRef(null);

  // Calculations
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const cindyShare = Math.max(0, netProfit * 0.3);
  const ownerShare = netProfit - cindyShare;
  const catBreakdown = CATEGORIES.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  // Fetch iCal when calendar tab opens
  useEffect(() => {
    if (tab === "calendar" && icalEvents.length === 0 && !icalLoading) {
      fetchIcal();
    }
  }, [tab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiHistory]);

  const fetchIcal = async () => {
    setIcalLoading(true);
    setIcalError("");
    try {
      const res = await fetch(PROXY);
      const text = await res.text();
      const events = parseIcal(text);
      setIcalEvents(events);
    } catch (e) {
      setIcalError("Không thể tải lịch. Kiểm tra kết nối mạng.");
    }
    setIcalLoading(false);
  };

  const addExpense = () => {
    if (!expForm.amount || isNaN(expForm.amount)) return;
    setExpenses([...expenses, { ...expForm, id: Date.now(), amount: parseFloat(expForm.amount) }]);
    setExpForm({ date: today(), category: "Cleaning", amount: "", note: "", by: "Harry" });
    setShowExpForm(false);
  };

  const addIncome = () => {
    if (!incForm.amount || isNaN(incForm.amount)) return;
    setIncome([...income, { ...incForm, id: Date.now(), amount: parseFloat(incForm.amount), nights: parseInt(incForm.nights) || 1 }]);
    setIncForm({ date: today(), amount: "", nights: "", guest: "", platform: "Airbnb" });
    setShowIncForm(false);
  };

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = aiQuery;
    setAiQuery("");
    setAiLoading(true);
    const newHistory = [...aiHistory, { role: "user", content: userMsg }];
    setAiHistory(newHistory);

    const upcomingBookings = icalEvents
      .filter(e => e.dtstart >= today())
      .slice(0, 10)
      .map(e => `${e.summary}: ${e.dtstart} → ${e.dtend} (${e.nights} đêm)`).join("\n");

    const context = `You are a financial assistant for "Poolside Paradise", an Airbnb short-term rental.
Owners: Harry and Lily. Partner: Cindy (30% of net profit).
Total Income: ${fmt(totalIncome)} | Total Expenses: ${fmt(totalExpenses)} | Net Profit: ${fmt(netProfit)}
Cindy share: ${fmt(cindyShare)} | Harry & Lily: ${fmt(ownerShare)}
Expenses: ${JSON.stringify(catBreakdown)}
Upcoming bookings from Airbnb iCal:\n${upcomingBookings || "None loaded"}
Answer in the same language as the user (English or Vietnamese). Be concise.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 1000,
          system: context, messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "DEBUG: " + JSON.stringify(data).slice(0,300);
      setAiHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      setAiHistory([...newHistory, { role: "assistant", content: "Lỗi: " + e.message }]);
    }
    setAiLoading(false);
  };

  // ── UI Components ──────────────────────────────────────────────────────────
  const StatCard = ({ label, value, sub, color }) => (
    <div style={{ background: color || PALETTE.teal, borderRadius: 16, padding: "16px 18px", color: "#fff", minWidth: 0 }}>
      <div style={{ fontSize: 11, opacity: 0.8, fontFamily: "Playfair Display, serif", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Playfair Display, serif", margin: "4px 0 2px" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.75 }}>{sub}</div>}
    </div>
  );

  const InputRow = ({ label, children }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: PALETTE.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    borderRadius: 10, border: "1.5px solid #dde8e8", fontSize: 14,
    fontFamily: "inherit", background: PALETTE.white, color: PALETTE.dark, outline: "none",
  };

  const Btn = ({ children, onClick, color, small }) => (
    <button onClick={onClick} style={{
      background: color || PALETTE.teal, color: "#fff", border: "none",
      borderRadius: 10, padding: small ? "7px 14px" : "11px 20px",
      fontSize: small ? 13 : 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>{children}</button>
  );

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  // ── Calendar renderer ────────────────────────────────────────────────────
  const renderCalendar = () => {
    const days = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDay(calYear, calMonth);
    const cells = [];

    // empty cells before first day
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);

    const todayStr = today();

    return (
      <div>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => {
            if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
            else setCalMonth(calMonth - 1);
          }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: PALETTE.teal }}>‹</button>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17 }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <button onClick={() => {
            if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
            else setCalMonth(calMonth + 1);
          }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: PALETTE.teal }}>›</button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 11, color: PALETTE.muted }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: PALETTE.coral, borderRadius: 2, marginRight: 4 }} />Booked</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#e8f5e5", borderRadius: 2, border: "1px solid #a5d6a7", marginRight: 4 }} />Available</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: PALETTE.tealLight, borderRadius: 2, marginRight: 4 }} />Today</span>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, color: PALETTE.muted, fontWeight: 600, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const booked = isBooked(dateStr, icalEvents);
            const isToday = dateStr === todayStr;
            const ev = getEventForDate(dateStr, icalEvents);
            return (
              <div key={d} onClick={() => ev && setSelectedEvent(ev)} style={{
                aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, fontSize: 13, fontWeight: isToday ? 700 : 400, cursor: ev ? "pointer" : "default",
                background: isToday ? PALETTE.tealLight : booked ? PALETTE.coral : "#e8f5e5",
                color: (isToday || booked) ? "#fff" : PALETTE.dark,
                border: isToday ? `2px solid ${PALETTE.tealDark}` : "none",
              }}>{d}</div>
            );
          })}
        </div>

        {/* Selected event detail */}
        {selectedEvent && (
          <div style={{ marginTop: 16, background: "#fff", borderRadius: 14, padding: 14, border: `2px solid ${PALETTE.coral}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, color: PALETTE.coral }}>📅 {selectedEvent.summary}</div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: PALETTE.muted, marginTop: 6 }}>
              Check-in: <b>{selectedEvent.dtstart}</b><br />
              Check-out: <b>{selectedEvent.dtend}</b><br />
              Số đêm: <b>{selectedEvent.nights}</b>
            </div>
          </div>
        )}

        {/* Upcoming bookings list */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, marginBottom: 10, fontSize: 15 }}>Upcoming Bookings</div>
          {icalEvents.filter(e => e.dtend >= todayStr).slice(0, 8).map((e, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{e.summary}</div>
                <div style={{ fontSize: 11, color: PALETTE.muted }}>{e.dtstart} → {e.dtend}</div>
              </div>
              <div style={{ background: PALETTE.coral, color: "#fff", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                {e.nights}n
              </div>
            </div>
          ))}
          {icalEvents.filter(e => e.dtend >= todayStr).length === 0 && (
            <div style={{ color: PALETTE.muted, fontSize: 13, textAlign: "center", padding: 20 }}>No upcoming bookings</div>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "dashboard", icon: "🏝️", label: "Home" },
    { id: "calendar", icon: "📅", label: "Calendar" },
    { id: "income", icon: "💰", label: "Income" },
    { id: "expenses", icon: "📋", label: "Expenses" },
    { id: "ai", icon: "🤖", label: "AI" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.sand, fontFamily: "'DM Sans', system-ui, sans-serif", color: PALETTE.dark, maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${PALETTE.tealDark} 0%, ${PALETTE.teal} 60%, ${PALETTE.tealLight} 100%)`, padding: "28px 20px 20px", color: "#fff" }}>
        <div style={{ fontSize: 22, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>🌴 Poolside Paradise</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Property Management · {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</div>
      </div>

      <div style={{ padding: "18px 16px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <StatCard label="Total Income" value={fmt(totalIncome)} sub={`${income.length} bookings`} color={PALETTE.teal} />
              <StatCard label="Expenses" value={fmt(totalExpenses)} sub={`${expenses.length} items`} color={PALETTE.coral} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <StatCard label="Net Profit" value={fmt(netProfit)} color={netProfit >= 0 ? PALETTE.tealDark : PALETTE.coral} />
              <StatCard label="Cindy 30%" value={fmt(cindyShare)} sub="Partner" color={PALETTE.gold} />
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, marginBottom: 10 }}>Owner Split</div>
              {[["Harry & Lily (70%)", fmt(ownerShare), PALETTE.teal], ["Cindy (30%)", fmt(cindyShare), PALETTE.gold]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 13, color: PALETTE.muted }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 16 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, marginBottom: 10 }}>Expenses by Category</div>
              {catBreakdown.map(({ cat, total }) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: PALETTE.muted, width: 100 }}>{cat}</div>
                  <div style={{ flex: 1, height: 7, background: "#eef4f4", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((total / totalExpenses) * 100)}%`, height: "100%", background: PALETTE.teal, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginLeft: 8, width: 50, textAlign: "right" }}>{fmt(total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18 }}>Airbnb Calendar</div>
              <Btn onClick={fetchIcal} small color={PALETTE.tealDark}>↻ Sync</Btn>
            </div>

            {icalLoading && (
              <div style={{ textAlign: "center", padding: 40, color: PALETTE.muted }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
                Đang tải lịch từ Airbnb...
              </div>
            )}
            {icalError && (
              <div style={{ background: "#fff0ee", borderRadius: 12, padding: 14, color: PALETTE.coral, marginBottom: 12, fontSize: 13 }}>
                ⚠️ {icalError}
              </div>
            )}
            {!icalLoading && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16 }}>
                {renderCalendar()}
              </div>
            )}
          </div>
        )}

        {/* INCOME */}
        {tab === "income" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18 }}>Income</div>
              <Btn onClick={() => setShowIncForm(!showIncForm)} small>+ Add</Btn>
            </div>
            {showIncForm && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <InputRow label="Date"><input type="date" style={inputStyle} value={incForm.date} onChange={e => setIncForm({ ...incForm, date: e.target.value })} /></InputRow>
                <InputRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0" value={incForm.amount} onChange={e => setIncForm({ ...incForm, amount: e.target.value })} /></InputRow>
                <InputRow label="Nights"><input type="number" style={inputStyle} placeholder="1" value={incForm.nights} onChange={e => setIncForm({ ...incForm, nights: e.target.value })} /></InputRow>
                <InputRow label="Guest"><input type="text" style={inputStyle} placeholder="Guest name" value={incForm.guest} onChange={e => setIncForm({ ...incForm, guest: e.target.value })} /></InputRow>
                <InputRow label="Platform">
                  <select style={{ ...inputStyle, appearance: "none" }} value={incForm.platform} onChange={e => setIncForm({ ...incForm, platform: e.target.value })}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </InputRow>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={addIncome}>Save</Btn>
                  <Btn onClick={() => setShowIncForm(false)} color={PALETTE.muted} small>Cancel</Btn>
                </div>
              </div>
            )}
            {income.map(r => (
              <div key={r.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.guest || "—"}</div>
                  <div style={{ fontSize: 12, color: PALETTE.muted }}>{r.date} · {r.nights}n · {r.platform}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: PALETTE.teal }}>{fmt(r.amount)}</div>
                  <button onClick={() => setIncome(income.filter(x => x.id !== r.id))} style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.coral, fontSize: 16 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXPENSES */}
        {tab === "expenses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18 }}>Expenses</div>
              <Btn onClick={() => setShowExpForm(!showExpForm)} small>+ Add</Btn>
            </div>
            {showExpForm && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <InputRow label="Date"><input type="date" style={inputStyle} value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></InputRow>
                <InputRow label="Category">
                  <select style={{ ...inputStyle, appearance: "none" }} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </InputRow>
                <InputRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} /></InputRow>
                <InputRow label="Note"><input type="text" style={inputStyle} placeholder="Description..." value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} /></InputRow>
                <InputRow label="By">
                  <select style={{ ...inputStyle, appearance: "none" }} value={expForm.by} onChange={e => setExpForm({ ...expForm, by: e.target.value })}>
                    {["Harry","Lily","Cindy"].map(n => <option key={n}>{n}</option>)}
                  </select>
                </InputRow>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={addExpense}>Save</Btn>
                  <Btn onClick={() => setShowExpForm(false)} color={PALETTE.muted} small>Cancel</Btn>
                </div>
              </div>
            )}
            {expenses.map(e => (
              <div key={e.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.category}</div>
                  <div style={{ fontSize: 12, color: PALETTE.muted }}>{e.date} · {e.note} · {e.by}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: PALETTE.coral }}>{fmt(e.amount)}</div>
                  <button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.coral, fontSize: 16 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI CHAT */}
        {tab === "ai" && (
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>AI Assistant</div>
            <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 12 }}>Hỏi về tài chính, lịch đặt phòng — EN hoặc VI</div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 14, minHeight: 320, maxHeight: 420, overflowY: "auto", marginBottom: 12 }}>
              {aiHistory.length === 0 && (
                <div style={{ color: PALETTE.muted, fontSize: 13, textAlign: "center", marginTop: 60 }}>
                  💬 "Tháng này lợi nhuận bao nhiêu?"<br />"Tuần tới có khách chưa?"
                </div>
              )}
              {aiHistory.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: 14, background: m.role === "user" ? PALETTE.teal : "#f0f5f5", color: m.role === "user" ? "#fff" : PALETTE.dark, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              ))}
              {aiLoading && <div style={{ color: PALETTE.muted, fontSize: 13 }}>⏳ Đang trả lời...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Hỏi gì đó..." value={aiQuery}
                onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} />
              <Btn onClick={askAI}>Gửi</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #e8efef", display: "flex", justifyContent: "space-around", padding: "8px 0", zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", color: tab === t.id ? PALETTE.teal : PALETTE.muted, fontWeight: tab === t.id ? 700 : 400 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
