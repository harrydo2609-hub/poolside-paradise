import { useState, useEffect, useRef, useCallback } from "react";

const PALETTE = {
  sand: "#F5EDD6", teal: "#0D7377", tealLight: "#14A0A5",
  tealDark: "#085054", coral: "#E8604C", gold: "#D4A843",
  dark: "#1A2B2C", muted: "#6B8C8E", white: "#FDFAF4",
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const todayStr = () => new Date().toISOString().split("T")[0];

const ICAL_URL = "https://www.airbnb.com/calendar/ical/903771582100260470.ics?t=5c6e23eb6a3447e78667ed85879cda9a";

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
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px",
  borderRadius: 10, border: "1.5px solid #dde8e8", fontSize: 16,
  fontFamily: "inherit", background: "#FDFAF4", color: "#1A2B2C", outline: "none",
};

const LabelRow = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 11, color: "#6B8C8E", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
    {children}
  </div>
);

const Btn = ({ children, onClick, color, small }) => (
  <button onClick={onClick} style={{
    background: color || PALETTE.teal, color: "#fff", border: "none",
    borderRadius: 10, padding: small ? "7px 14px" : "11px 20px",
    fontSize: small ? 13 : 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  }}>{children}</button>
);

// ── Stable form components (defined OUTSIDE App to prevent re-mount) ──────────
function ExpenseForm({ onSave, onCancel }) {
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState("Cleaning");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [by, setBy] = useState("Harry");

  const handleSave = () => {
    if (!amount || isNaN(amount)) return;
    onSave({ date, category, amount: parseFloat(amount), note, by });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <LabelRow label="Date"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></LabelRow>
      <LabelRow label="Category">
        <select style={{ ...inputStyle }} value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </LabelRow>
      <LabelRow label="Amount ($)">
        <input type="number" style={inputStyle} placeholder="0" value={amount}
          onChange={e => setAmount(e.target.value)} inputMode="decimal" />
      </LabelRow>
      <LabelRow label="Note">
        <input type="text" style={inputStyle} placeholder="Description..." value={note}
          onChange={e => setNote(e.target.value)} />
      </LabelRow>
      <LabelRow label="By">
        <select style={{ ...inputStyle }} value={by} onChange={e => setBy(e.target.value)}>
          {["Harry","Lily","Cindy"].map(n => <option key={n}>{n}</option>)}
        </select>
      </LabelRow>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={handleSave}>Save</Btn>
        <Btn onClick={onCancel} color={PALETTE.muted} small>Cancel</Btn>
      </div>
    </div>
  );
}

function IncomeForm({ onSave, onCancel }) {
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState("");
  const [nights, setNights] = useState("");
  const [guest, setGuest] = useState("");
  const [platform, setPlatform] = useState("Airbnb");

  const handleSave = () => {
    if (!amount || isNaN(amount)) return;
    onSave({ date, amount: parseFloat(amount), nights: parseInt(nights) || 1, guest, platform });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <LabelRow label="Date"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></LabelRow>
      <LabelRow label="Amount ($)">
        <input type="number" style={inputStyle} placeholder="0" value={amount}
          onChange={e => setAmount(e.target.value)} inputMode="decimal" />
      </LabelRow>
      <LabelRow label="Nights">
        <input type="number" style={inputStyle} placeholder="1" value={nights}
          onChange={e => setNights(e.target.value)} inputMode="numeric" />
      </LabelRow>
      <LabelRow label="Guest">
        <input type="text" style={inputStyle} placeholder="Guest name" value={guest}
          onChange={e => setGuest(e.target.value)} />
      </LabelRow>
      <LabelRow label="Platform">
        <select style={{ ...inputStyle }} value={platform} onChange={e => setPlatform(e.target.value)}>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </LabelRow>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={handleSave}>Save</Btn>
        <Btn onClick={onCancel} color={PALETTE.muted} small>Cancel</Btn>
      </div>
    </div>
  );
}

// ── iCal parser ───────────────────────────────────────────────────────────────
function parseIcal(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const get = (key) => { const m = b.match(new RegExp(`${key}[^:]*:([^\r\n]+)`)); return m ? m[1].trim() : ""; };
    const parseDate = (s) => {
      if (!s) return null;
      const clean = s.replace(/T.*/, "");
      return clean.length === 8 ? `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}` : null;
    };
    const summary = get("SUMMARY") || "Booked";
    const dtstart = parseDate(get("DTSTART"));
    const dtend = parseDate(get("DTEND"));
    if (dtstart) {
      const nights = dtstart && dtend ? Math.round((new Date(dtend) - new Date(dtstart)) / 86400000) : 0;
      events.push({ summary, dtstart, dtend, nights });
    }
  }
  return events.sort((a, b) => a.dtstart > b.dtstart ? 1 : -1);
}

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function isBooked(d, events) { return events.some(e => e.dtstart <= d && (e.dtend ? d < e.dtend : false)); }
function getEventForDate(d, events) { return events.find(e => e.dtstart <= d && (e.dtend ? d < e.dtend : false)); }

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState(INIT_EXPENSES);
  const [income, setIncome] = useState(INIT_INCOME);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [icalEvents, setIcalEvents] = useState([]);
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalError, setIcalError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const chatEndRef = useRef(null);

  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const cindyShare = Math.max(0, netProfit * 0.3);
  const ownerShare = netProfit - cindyShare;
  const catBreakdown = CATEGORIES.map(c => ({ cat: c, total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0);

  useEffect(() => {
    if (tab === "calendar" && icalEvents.length === 0 && !icalLoading) fetchIcal();
  }, [tab]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiHistory]);

  const fetchIcal = async () => {
    setIcalLoading(true); setIcalError("");
    try {
      const res = await fetch("/api/ical");
      const text = await res.text();
      setIcalEvents(parseIcal(text));
    } catch (e) { setIcalError("Không thể tải lịch. Thử lại."); }
    setIcalLoading(false);
  };

  const handleAddExpense = useCallback((data) => {
    setExpenses(prev => [...prev, { ...data, id: Date.now() }]);
    setShowExpForm(false);
  }, []);

  const handleAddIncome = useCallback((data) => {
    setIncome(prev => [...prev, { ...data, id: Date.now() }]);
    setShowIncForm(false);
  }, []);

  const cancelExp = useCallback(() => setShowExpForm(false), []);
  const cancelInc = useCallback(() => setShowIncForm(false), []);

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = aiQuery;
    setAiQuery(""); setAiLoading(true);
    const newHistory = [...aiHistory, { role: "user", content: userMsg }];
    setAiHistory(newHistory);
    const upcomingBookings = icalEvents.filter(e => e.dtstart >= todayStr()).slice(0,10).map(e => `${e.summary}: ${e.dtstart}→${e.dtend} (${e.nights}n)`).join("\n");
    const context = `You are a financial assistant for "Poolside Paradise", an Airbnb rental. Owners: Harry & Lily. Partner: Cindy (30% of net profit). Total Income: ${fmt(totalIncome)} | Expenses: ${fmt(totalExpenses)} | Net Profit: ${fmt(netProfit)} | Cindy: ${fmt(cindyShare)} | Harry & Lily: ${fmt(ownerShare)}. Expenses: ${JSON.stringify(catBreakdown)}. Upcoming: ${upcomingBookings||"None"}. Reply in same language as user.`;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system: context, messages: newHistory }) });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Lỗi: " + JSON.stringify(data).slice(0,200);
      setAiHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch (e) { setAiHistory([...newHistory, { role: "assistant", content: "Lỗi: " + e.message }]); }
    setAiLoading(false);
  };

  const StatCard = ({ label, value, sub, color }) => (
    <div style={{ background: color || PALETTE.teal, borderRadius: 16, padding: "16px 18px", color: "#fff", minWidth: 0 }}>
      <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Playfair Display, serif", margin: "4px 0 2px" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.75 }}>{sub}</div>}
    </div>
  );

  const renderCalendar = () => {
    const days = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDay(calYear, calMonth);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const today = todayStr();
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => { if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:PALETTE.teal }}>‹</button>
          <div style={{ fontFamily:"Playfair Display, serif", fontWeight:700, fontSize:17 }}>{MONTH_NAMES[calMonth]} {calYear}</div>
          <button onClick={() => { if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:PALETTE.teal }}>›</button>
        </div>
        <div style={{ display:"flex", gap:14, marginBottom:12, fontSize:11, color:PALETTE.muted }}>
          <span><span style={{ display:"inline-block",width:10,height:10,background:PALETTE.coral,borderRadius:2,marginRight:4 }}/>Booked</span>
          <span><span style={{ display:"inline-block",width:10,height:10,background:"#e8f5e5",borderRadius:2,border:"1px solid #a5d6a7",marginRight:4 }}/>Available</span>
          <span><span style={{ display:"inline-block",width:10,height:10,background:PALETTE.tealLight,borderRadius:2,marginRight:4 }}/>Today</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DAY_NAMES.map(d => <div key={d} style={{ textAlign:"center",fontSize:11,color:PALETTE.muted,fontWeight:600,padding:"4px 0" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((d,i) => {
            if (!d) return <div key={`e-${i}`}/>;
            const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const booked = isBooked(dateStr, icalEvents);
            const isToday = dateStr === today;
            const ev = getEventForDate(dateStr, icalEvents);
            return <div key={d} onClick={() => ev && setSelectedEvent(ev)} style={{ aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:13,fontWeight:isToday?700:400,cursor:ev?"pointer":"default",background:isToday?PALETTE.tealLight:booked?PALETTE.coral:"#e8f5e5",color:(isToday||booked)?"#fff":PALETTE.dark,border:isToday?`2px solid ${PALETTE.tealDark}`:"none" }}>{d}</div>;
          })}
        </div>
        {selectedEvent && (
          <div style={{ marginTop:16,background:"#fff",borderRadius:14,padding:14,border:`2px solid ${PALETTE.coral}` }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <div style={{ fontWeight:700,color:PALETTE.coral }}>📅 {selectedEvent.summary}</div>
              <button onClick={() => setSelectedEvent(null)} style={{ background:"none",border:"none",color:PALETTE.muted,cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            <div style={{ fontSize:13,color:PALETTE.muted,marginTop:6 }}>Check-in: <b>{selectedEvent.dtstart}</b><br/>Check-out: <b>{selectedEvent.dtend}</b><br/>Số đêm: <b>{selectedEvent.nights}</b></div>
          </div>
        )}
        <div style={{ marginTop:18 }}>
          <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10,fontSize:15 }}>Upcoming Bookings</div>
          {icalEvents.filter(e => e.dtend >= today).slice(0,8).map((e,i) => (
            <div key={i} style={{ background:"#fff",borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div><div style={{ fontWeight:600,fontSize:13 }}>{e.summary}</div><div style={{ fontSize:11,color:PALETTE.muted }}>{e.dtstart} → {e.dtend}</div></div>
              <div style={{ background:PALETTE.coral,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{e.nights}n</div>
            </div>
          ))}
          {icalEvents.filter(e => e.dtend >= today).length === 0 && <div style={{ color:PALETTE.muted,fontSize:13,textAlign:"center",padding:20 }}>No upcoming bookings</div>}
        </div>
      </div>
    );
  };

  const tabs = [
    { id:"dashboard", icon:"🏝️", label:"Home" },
    { id:"calendar", icon:"📅", label:"Calendar" },
    { id:"income", icon:"💰", label:"Income" },
    { id:"expenses", icon:"📋", label:"Expenses" },
    { id:"ai", icon:"🤖", label:"AI" },
  ];

  return (
    <div style={{ minHeight:"100vh",background:PALETTE.sand,fontFamily:"'DM Sans',system-ui,sans-serif",color:PALETTE.dark,maxWidth:480,margin:"0 auto",paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      <div style={{ background:`linear-gradient(135deg,${PALETTE.tealDark} 0%,${PALETTE.teal} 60%,${PALETTE.tealLight} 100%)`,padding:"28px 20px 20px",color:"#fff" }}>
        <div style={{ fontSize:22,fontFamily:"Playfair Display, serif",fontWeight:700 }}>🌴 Poolside Paradise</div>
        <div style={{ fontSize:12,opacity:0.75,marginTop:2 }}>Property Management · {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</div>
      </div>

      <div style={{ padding:"18px 16px" }}>

        {tab==="dashboard" && (
          <div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <StatCard label="Total Income" value={fmt(totalIncome)} sub={`${income.length} bookings`} color={PALETTE.teal}/>
              <StatCard label="Expenses" value={fmt(totalExpenses)} sub={`${expenses.length} items`} color={PALETTE.coral}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
              <StatCard label="Net Profit" value={fmt(netProfit)} color={netProfit>=0?PALETTE.tealDark:PALETTE.coral}/>
              <StatCard label="Cindy 30%" value={fmt(cindyShare)} sub="Partner" color={PALETTE.gold}/>
            </div>
            <div style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:12 }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10 }}>Owner Split</div>
              {[["Harry & Lily (70%)",fmt(ownerShare),PALETTE.teal],["Cindy (30%)",fmt(cindyShare),PALETTE.gold]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f0f0f0" }}>
                  <span style={{ fontSize:13,color:PALETTE.muted }}>{l}</span>
                  <span style={{ fontWeight:700,color:c }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff",borderRadius:16,padding:16 }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10 }}>Expenses by Category</div>
              {catBreakdown.map(({cat,total})=>(
                <div key={cat} style={{ display:"flex",alignItems:"center",marginBottom:8 }}>
                  <div style={{ fontSize:12,color:PALETTE.muted,width:100 }}>{cat}</div>
                  <div style={{ flex:1,height:7,background:"#eef4f4",borderRadius:4,overflow:"hidden" }}>
                    <div style={{ width:`${Math.round((total/totalExpenses)*100)}%`,height:"100%",background:PALETTE.teal,borderRadius:4 }}/>
                  </div>
                  <div style={{ fontSize:12,fontWeight:600,marginLeft:8,width:50,textAlign:"right" }}>{fmt(total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="calendar" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18 }}>Airbnb Calendar</div>
              <Btn onClick={fetchIcal} small color={PALETTE.tealDark}>↻ Sync</Btn>
            </div>
            {icalLoading && <div style={{ textAlign:"center",padding:40,color:PALETTE.muted }}><div style={{ fontSize:32,marginBottom:10 }}>⏳</div>Đang tải lịch...</div>}
            {icalError && <div style={{ background:"#fff0ee",borderRadius:12,padding:14,color:PALETTE.coral,marginBottom:12,fontSize:13 }}>⚠️ {icalError}</div>}
            {!icalLoading && <div style={{ background:"#fff",borderRadius:16,padding:16 }}>{renderCalendar()}</div>}
          </div>
        )}

        {tab==="income" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18 }}>Income</div>
              <Btn onClick={() => setShowIncForm(v=>!v)} small>+ Add</Btn>
            </div>
            {showIncForm && <IncomeForm onSave={handleAddIncome} onCancel={cancelInc}/>}
            {income.map(r=>(
              <div key={r.id} style={{ background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{r.guest||"—"}</div>
                  <div style={{ fontSize:12,color:PALETTE.muted }}>{r.date} · {r.nights}n · {r.platform}</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ fontWeight:700,color:PALETTE.teal }}>{fmt(r.amount)}</div>
                  <button onClick={()=>setIncome(prev=>prev.filter(x=>x.id!==r.id))} style={{ background:"none",border:"none",cursor:"pointer",color:PALETTE.coral,fontSize:16 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="expenses" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18 }}>Expenses</div>
              <Btn onClick={() => setShowExpForm(v=>!v)} small>+ Add</Btn>
            </div>
            {showExpForm && <ExpenseForm onSave={handleAddExpense} onCancel={cancelExp}/>}
            {expenses.map(e=>(
              <div key={e.id} style={{ background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{e.category}</div>
                  <div style={{ fontSize:12,color:PALETTE.muted }}>{e.date} · {e.note} · {e.by}</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ fontWeight:700,color:PALETTE.coral }}>{fmt(e.amount)}</div>
                  <button onClick={()=>setExpenses(prev=>prev.filter(x=>x.id!==e.id))} style={{ background:"none",border:"none",cursor:"pointer",color:PALETTE.coral,fontSize:16 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="ai" && (
          <div>
            <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18,marginBottom:4 }}>AI Assistant</div>
            <div style={{ fontSize:12,color:PALETTE.muted,marginBottom:12 }}>Hỏi về tài chính, lịch đặt phòng — EN hoặc VI</div>
            <div style={{ background:"#fff",borderRadius:16,padding:14,minHeight:320,maxHeight:420,overflowY:"auto",marginBottom:12 }}>
              {aiHistory.length===0 && <div style={{ color:PALETTE.muted,fontSize:13,textAlign:"center",marginTop:60 }}>💬 "Tháng này lợi nhuận bao nhiêu?"<br/>"Tuần tới có khách chưa?"</div>}
              {aiHistory.map((m,i)=>(
                <div key={i} style={{ marginBottom:10,display:"flex",flexDirection:m.role==="user"?"row-reverse":"row" }}>
                  <div style={{ maxWidth:"82%",padding:"10px 13px",borderRadius:14,background:m.role==="user"?PALETTE.teal:"#f0f5f5",color:m.role==="user"?"#fff":PALETTE.dark,fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap" }}>{m.content}</div>
                </div>
              ))}
              {aiLoading && <div style={{ color:PALETTE.muted,fontSize:13 }}>⏳ Đang trả lời...</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <input style={{ ...inputStyle,flex:1 }} placeholder="Hỏi gì đó..." value={aiQuery}
                onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()}/>
              <Btn onClick={askAI}>Gửi</Btn>
            </div>
          </div>
        )}
      </div>

      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #e8efef",display:"flex",justifyContent:"space-around",padding:"8px 0",zIndex:100 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px",color:tab===t.id?PALETTE.teal:PALETTE.muted,fontWeight:tab===t.id?700:400 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
