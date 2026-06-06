import { useState, useEffect, useRef, useCallback } from "react";

const PALETTE = {
  sand: "#F5EDD6", teal: "#0D7377", tealLight: "#14A0A5",
  tealDark: "#085054", coral: "#E8604C", gold: "#D4A843",
  dark: "#1A2B2C", muted: "#6B8C8E", white: "#FDFAF4",
};

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const todayStr = () => new Date().toISOString().split("T")[0];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_VI = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const CATEGORIES = ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"];
const PLATFORMS = ["Airbnb","VRBO","Direct","Other"];

const inputStyle = { width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:"1.5px solid #dde8e8", fontSize:16, fontFamily:"inherit", background:"#FDFAF4", color:"#1A2B2C", outline:"none" };
const LabelRow = ({ label, children }) => (
  <div style={{ marginBottom:12 }}>
    <label style={{ display:"block", fontSize:11, color:"#6B8C8E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>{label}</label>
    {children}
  </div>
);
const Btn = ({ children, onClick, color, small, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ background:disabled?"#ccc":(color||PALETTE.teal), color:"#fff", border:"none", borderRadius:10, padding:small?"7px 14px":"11px 20px", fontSize:small?13:15, fontWeight:600, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit" }}>{children}</button>
);

// ── Bill Scanner ──────────────────────────────────────────────────────────────
function BillScanner({ onParsed, onCancel }) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      setPreview(ev.target.result);
      setScanning(true);
      try {
        const r = await fetch("/api/parse-bill", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });
        const data = await r.json();
        onParsed(data);
      } catch (e) { alert("Không đọc được bill. Thử lại!"); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:16, marginBottom:14, textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
      <div style={{ fontSize:14, color:PALETTE.muted, marginBottom:12 }}>Chụp hoặc chọn ảnh hóa đơn</div>
      {preview && <img src={preview} style={{ width:"100%", borderRadius:10, marginBottom:12, maxHeight:200, objectFit:"cover" }} />}
      {scanning ? (
        <div style={{ color:PALETTE.teal, fontWeight:600 }}>🤖 AI đang đọc bill...</div>
      ) : (
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <Btn onClick={() => fileRef.current.click()}>📷 Chọn ảnh</Btn>
          <Btn onClick={onCancel} color={PALETTE.muted} small>Hủy</Btn>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleFile} />
    </div>
  );
}

// ── Expense Form ──────────────────────────────────────────────────────────────
function ExpenseForm({ onSave, onCancel, saving, prefill }) {
  const [date, setDate] = useState(prefill?.date || todayStr());
  const [category, setCategory] = useState(prefill?.category || "Cleaning");
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : "");
  const [note, setNote] = useState(prefill?.note || "");
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
    <div style={{ background:"#fff", borderRadius:16, padding:16, marginBottom:14 }}>
      {showScanner && <BillScanner onParsed={handleParsed} onCancel={() => setShowScanner(false)} />}
      {!showScanner && (
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
        <button onClick={() => setShowScanner(true)} style={{ background:PALETTE.tealLight, color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📸 Scan Bill</button>
      </div>
      )}
      <LabelRow label="Date"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></LabelRow>
      <LabelRow label="Category"><select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></LabelRow>
      <LabelRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/></LabelRow>
      <LabelRow label="Note"><input type="text" style={inputStyle} placeholder="Description..." value={note} onChange={e=>setNote(e.target.value)}/></LabelRow>
      <LabelRow label="By"><select style={inputStyle} value={by} onChange={e=>setBy(e.target.value)}>{["Harry","Lily","Cindy"].map(n=><option key={n}>{n}</option>)}</select></LabelRow>
      {!showScanner && (
      <div style={{ display:"flex", gap:8 }}>
        <Btn onClick={()=>{ if(!amount||isNaN(amount))return; onSave({date,category,amount:parseFloat(amount),note,by}); }} disabled={saving}>{saving?"Saving...":"Save"}</Btn>
        <Btn onClick={onCancel} color={PALETTE.muted} small>Cancel</Btn>
      </div>
      )}
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
    <div style={{ background:"#fff", borderRadius:16, padding:16, marginBottom:14 }}>
      <LabelRow label="Date"><input type="date" style={inputStyle} value={date} onChange={e=>setDate(e.target.value)}/></LabelRow>
      <LabelRow label="Amount ($)"><input type="number" style={inputStyle} placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/></LabelRow>
      <LabelRow label="Nights"><input type="number" style={inputStyle} placeholder="1" value={nights} onChange={e=>setNights(e.target.value)} inputMode="numeric"/></LabelRow>
      <LabelRow label="Guest"><input type="text" style={inputStyle} placeholder="Guest name" value={guest} onChange={e=>setGuest(e.target.value)}/></LabelRow>
      <LabelRow label="Platform"><select style={inputStyle} value={platform} onChange={e=>setPlatform(e.target.value)}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></LabelRow>
      <div style={{ display:"flex", gap:8 }}>
        <Btn onClick={()=>{ if(!amount||isNaN(amount))return; onSave({date,amount:parseFloat(amount),nights:parseInt(nights)||1,guest,platform}); }} disabled={saving}>{saving?"Saving...":"Save"}</Btn>
        <Btn onClick={onCancel} color={PALETTE.muted} small>Cancel</Btn>
      </div>
    </div>
  );
}

// ── iCal ─────────────────────────────────────────────────────────────────────
function parseIcal(text) {
  const events=[];
  const blocks=text.split("BEGIN:VEVENT");
  for(let i=1;i<blocks.length;i++){
    const b=blocks[i];
    const get=(key)=>{const m=b.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));return m?m[1].trim():"";};
    const pd=(s)=>{if(!s)return null;const c=s.replace(/T.*/,"");return c.length===8?`${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}`:null;};
    const dtstart=pd(get("DTSTART")),dtend=pd(get("DTEND"));
    if(dtstart)events.push({summary:get("SUMMARY")||"Booked",dtstart,dtend,nights:dtstart&&dtend?Math.round((new Date(dtend)-new Date(dtstart))/86400000):0});
  }
  return events.sort((a,b)=>a.dtstart>b.dtstart?1:-1);
}
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function getFirstDay(y,m){return new Date(y,m,1).getDay();}
function isBooked(d,evs){return evs.some(e=>e.dtstart<=d&&(e.dtend?d<e.dtend:false));}
function getEv(d,evs){return evs.find(e=>e.dtstart<=d&&(e.dtend?d<e.dtend:false));}

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generatePDF(month, year, expenses, income) {
  const filteredExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const filteredInc = income.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const totalInc = filteredInc.reduce((s,r)=>s+r.amount,0);
  const totalExp = filteredExp.reduce((s,e)=>s+e.amount,0);
  const netProfit = totalInc - totalExp;
  const cindy = Math.max(0, netProfit * 0.3);
  const owners = netProfit - cindy;
  const fmt2 = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Georgia,serif;padding:40px;color:#1A2B2C;max-width:700px;margin:0 auto;}
  h1{color:#0D7377;font-size:28px;margin-bottom:4px;}
  .sub{color:#6B8C8E;font-size:14px;margin-bottom:30px;}
  .section{margin-bottom:24px;}
  .section h2{color:#0D7377;font-size:16px;border-bottom:2px solid #0D7377;padding-bottom:6px;margin-bottom:12px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#0D7377;color:#fff;padding:8px 10px;text-align:left;}
  td{padding:7px 10px;border-bottom:1px solid #eee;}
  tr:nth-child(even) td{background:#f9f9f9;}
  .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
  .card{background:#f5f5f5;border-radius:8px;padding:14px;border-left:4px solid #0D7377;}
  .card.coral{border-left-color:#E8604C;}
  .card.gold{border-left-color:#D4A843;}
  .card.dark{border-left-color:#085054;}
  .card-label{font-size:11px;color:#6B8C8E;text-transform:uppercase;letter-spacing:1px;}
  .card-value{font-size:22px;font-weight:700;color:#1A2B2C;margin-top:4px;}
  .footer{margin-top:40px;font-size:11px;color:#6B8C8E;text-align:center;}
</style></head><body>
<h1>🌴 Poolside Paradise</h1>
<div class="sub">Monthly Report — ${MONTH_NAMES[month]} ${year}</div>

<div class="summary-grid">
  <div class="card"><div class="card-label">Total Income</div><div class="card-value">${fmt2(totalInc)}</div></div>
  <div class="card coral"><div class="card-label">Total Expenses</div><div class="card-value">${fmt2(totalExp)}</div></div>
  <div class="card dark"><div class="card-label">Net Profit</div><div class="card-value">${fmt2(netProfit)}</div></div>
  <div class="card gold"><div class="card-label">Cindy (30%)</div><div class="card-value">${fmt2(cindy)}</div></div>
</div>

<div class="section">
  <h2>Settlement</h2>
  <table><tr><th>Person</th><th>Share</th><th>Amount</th></tr>
  <tr><td>Harry & Lily</td><td>70%</td><td>${fmt2(owners)}</td></tr>
  <tr><td>Cindy</td><td>30%</td><td>${fmt2(cindy)}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Income (${filteredInc.length} bookings)</h2>
  <table><tr><th>Date</th><th>Guest</th><th>Nights</th><th>Platform</th><th>Amount</th></tr>
  ${filteredInc.map(r=>`<tr><td>${r.date}</td><td>${r.guest||"—"}</td><td>${r.nights}</td><td>${r.platform}</td><td>${fmt2(r.amount)}</td></tr>`).join("")}
  <tr><td colspan="4"><strong>Total</strong></td><td><strong>${fmt2(totalInc)}</strong></td></tr>
  </table>
</div>

<div class="section">
  <h2>Expenses (${filteredExp.length} items)</h2>
  <table><tr><th>Date</th><th>Category</th><th>Note</th><th>By</th><th>Amount</th></tr>
  ${filteredExp.map(e=>`<tr><td>${e.date}</td><td>${e.category}</td><td>${e.note||"—"}</td><td>${e.by}</td><td>${fmt2(e.amount)}</td></tr>`).join("")}
  <tr><td colspan="4"><strong>Total</strong></td><td><strong>${fmt2(totalExp)}</strong></td></tr>
  </table>
</div>

<div class="footer">Generated by Poolside Paradise App · ${new Date().toLocaleDateString()}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `poolside-report-${MONTH_NAMES[month]}-${year}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── API helpers ───────────────────────────────────────────────────────────────
const api = async (action, body) => {
  const r = await fetch(`/api/baserow?action=${action}`, body ? { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) } : { method:"GET" });
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

  // Filter state
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMode, setFilterMode] = useState("month"); // "month" | "all"

  // AI
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Calendar
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [icalEvents, setIcalEvents] = useState([]);
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalError, setIcalError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    Promise.all([api("get_expenses"), api("get_income")])
      .then(([exp, inc]) => { setExpenses(Array.isArray(exp)?exp:[]); setIncome(Array.isArray(inc)?inc:[]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if(tab==="calendar"&&icalEvents.length===0&&!icalLoading)fetchIcal(); }, [tab]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [aiHistory]);

  // Filtered data
  const filteredExpenses = filterMode==="all" ? expenses : expenses.filter(e => {
    const d=new Date(e.date); return d.getMonth()===filterMonth && d.getFullYear()===filterYear;
  });
  const filteredIncome = filterMode==="all" ? income : income.filter(r => {
    const d=new Date(r.date); return d.getMonth()===filterMonth && d.getFullYear()===filterYear;
  });

  const totalIncome = filteredIncome.reduce((s,r)=>s+r.amount,0);
  const totalExpenses = filteredExpenses.reduce((s,r)=>s+r.amount,0);
  const netProfit = totalIncome-totalExpenses;
  const cindyShare = Math.max(0,netProfit*0.3);
  const ownerShare = netProfit-cindyShare;
  const catBreakdown = CATEGORIES.map(c=>({cat:c,total:filteredExpenses.filter(e=>e.category===c).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0);

  const fetchIcal = async () => {
    setIcalLoading(true); setIcalError("");
    try { const r=await fetch("/api/ical"); setIcalEvents(parseIcal(await r.text())); }
    catch(e){setIcalError("Không thể tải lịch.");}
    setIcalLoading(false);
  };

  const handleAddExpense = useCallback(async (data) => {
    setSaving(true);
    try { const saved=await api("add_expense",data); setExpenses(prev=>[...prev,{...data,id:saved.id||Date.now()}]); setShowExpForm(false); }
    catch(e){}
    setSaving(false);
  },[]);

  const handleAddIncome = useCallback(async (data) => {
    setSaving(true);
    try { const saved=await api("add_income",data); setIncome(prev=>[...prev,{...data,id:saved.id||Date.now()}]); setShowIncForm(false); }
    catch(e){}
    setSaving(false);
  },[]);

  const handleDelExpense = async (id) => { setExpenses(prev=>prev.filter(x=>x.id!==id)); await api("del_expense",{id}); };
  const handleDelIncome = async (id) => { setIncome(prev=>prev.filter(x=>x.id!==id)); await api("del_income",{id}); };

  const cancelExp = useCallback(()=>setShowExpForm(false),[]);
  const cancelInc = useCallback(()=>setShowIncForm(false),[]);

  // AI with month filter parsing
  const askAI = async () => {
    if(!aiQuery.trim())return;
    const userMsg=aiQuery; setAiQuery(""); setAiLoading(true);

    // Parse month from query e.g. "tháng 2", "tháng 6", "month 3"
    let qMonth=filterMonth, qYear=filterYear, qMode=filterMode;
    const viMatch = userMsg.match(/tháng\s*(\d{1,2})/i);
    const enMatch = userMsg.match(/month\s*(\d{1,2})/i);
    const match = viMatch || enMatch;
    if(match){
      const m=parseInt(match[1])-1;
      if(m>=0&&m<=11){qMonth=m; qMode="month"; setFilterMonth(m); setFilterMode("month");}
    }

    const qExp = qMode==="all"?expenses:expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===qMonth&&d.getFullYear()===qYear;});
    const qInc = qMode==="all"?income:income.filter(r=>{const d=new Date(r.date);return d.getMonth()===qMonth&&d.getFullYear()===qYear;});
    const qTotalInc=qInc.reduce((s,r)=>s+r.amount,0);
    const qTotalExp=qExp.reduce((s,r)=>s+r.amount,0);
    const qProfit=qTotalInc-qTotalExp;
    const qCindy=Math.max(0,qProfit*0.3);
    const qOwners=qProfit-qCindy;

    const newHistory=[...aiHistory,{role:"user",content:userMsg}];
    setAiHistory(newHistory);
    const context=`You are a financial assistant for "Poolside Paradise" Airbnb. Owners: Harry & Lily. Partner: Cindy (30% of net profit).
Period: ${qMode==="all"?"All time":`${MONTH_NAMES[qMonth]} ${qYear}`}
Income: ${fmt(qTotalInc)} (${qInc.length} bookings) | Expenses: ${fmt(qTotalExp)} | Net Profit: ${fmt(qProfit)} | Cindy: ${fmt(qCindy)} | Harry & Lily: ${fmt(qOwners)}
Bookings: ${JSON.stringify(qInc)}
Expenses: ${JSON.stringify(qExp)}
Reply in same language as user. Be concise.`;
    try {
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,system:context,messages:newHistory})});
      const d=await r.json();
      setAiHistory([...newHistory,{role:"assistant",content:d.content?.[0]?.text||"Lỗi"}]);
    } catch(e){setAiHistory([...newHistory,{role:"assistant",content:"Lỗi: "+e.message}]);}
    setAiLoading(false);
  };

  const StatCard=({label,value,sub,color})=>(
    <div style={{background:color||PALETTE.teal,borderRadius:16,padding:"16px 18px",color:"#fff",minWidth:0}}>
      <div style={{fontSize:11,opacity:0.8,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,fontFamily:"Playfair Display, serif",margin:"4px 0 2px"}}>{value}</div>
      {sub&&<div style={{fontSize:11,opacity:0.75}}>{sub}</div>}
    </div>
  );

  // Month filter bar
  const MonthBar = () => (
    <div style={{background:"#fff",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8,overflowX:"auto"}}>
      <button onClick={()=>{if(filterMonth===0){setFilterMonth(11);setFilterYear(y=>y-1);}else setFilterMonth(m=>m-1);setFilterMode("month");}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:PALETTE.teal}}>‹</button>
      <div style={{flex:1,textAlign:"center",fontWeight:700,fontSize:14,color:PALETTE.dark,whiteSpace:"nowrap"}}>{MONTH_NAMES[filterMonth]} {filterYear}</div>
      <button onClick={()=>{if(filterMonth===11){setFilterMonth(0);setFilterYear(y=>y+1);}else setFilterMonth(m=>m+1);setFilterMode("month");}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:PALETTE.teal}}>›</button>
      <button onClick={()=>setFilterMode(m=>m==="all"?"month":"all")} style={{background:filterMode==="all"?PALETTE.teal:"#eee",color:filterMode==="all"?"#fff":PALETTE.muted,border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
        {filterMode==="all"?"All":"All time"}
      </button>
      <button onClick={()=>generatePDF(filterMonth,filterYear,expenses,income)} style={{background:PALETTE.coral,color:"#fff",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 PDF</button>
    </div>
  );

  const renderCalendar=()=>{
    const days=getDaysInMonth(calYear,calMonth),firstDay=getFirstDay(calYear,calMonth);
    const cells=[]; for(let i=0;i<firstDay;i++)cells.push(null); for(let d=1;d<=days;d++)cells.push(d);
    const today=todayStr();
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:PALETTE.teal}}>‹</button>
          <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:17}}>{MONTH_NAMES[calMonth]} {calYear}</div>
          <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:PALETTE.teal}}>›</button>
        </div>
        <div style={{display:"flex",gap:14,marginBottom:12,fontSize:11,color:PALETTE.muted}}>
          <span><span style={{display:"inline-block",width:10,height:10,background:PALETTE.coral,borderRadius:2,marginRight:4}}/>Booked</span>
          <span><span style={{display:"inline-block",width:10,height:10,background:"#e8f5e5",borderRadius:2,border:"1px solid #a5d6a7",marginRight:4}}/>Available</span>
          <span><span style={{display:"inline-block",width:10,height:10,background:PALETTE.tealLight,borderRadius:2,marginRight:4}}/>Today</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
          {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:PALETTE.muted,fontWeight:600,padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((d,i)=>{
            if(!d)return<div key={`e-${i}`}/>;
            const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const booked=isBooked(ds,icalEvents),isToday=ds===today,ev=getEv(ds,icalEvents);
            return<div key={d} onClick={()=>ev&&setSelectedEvent(ev)} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:13,fontWeight:isToday?700:400,cursor:ev?"pointer":"default",background:isToday?PALETTE.tealLight:booked?PALETTE.coral:"#e8f5e5",color:(isToday||booked)?"#fff":PALETTE.dark,border:isToday?`2px solid ${PALETTE.tealDark}`:"none"}}>{d}</div>;
          })}
        </div>
        {selectedEvent&&(
          <div style={{marginTop:16,background:"#fff",borderRadius:14,padding:14,border:`2px solid ${PALETTE.coral}`}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontWeight:700,color:PALETTE.coral}}>📅 {selectedEvent.summary}</div>
              <button onClick={()=>setSelectedEvent(null)} style={{background:"none",border:"none",color:PALETTE.muted,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{fontSize:13,color:PALETTE.muted,marginTop:6}}>Check-in: <b>{selectedEvent.dtstart}</b><br/>Check-out: <b>{selectedEvent.dtend}</b><br/>Số đêm: <b>{selectedEvent.nights}</b></div>
          </div>
        )}
        <div style={{marginTop:18}}>
          <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10,fontSize:15}}>Upcoming Bookings</div>
          {icalEvents.filter(e=>e.dtend>=today).slice(0,8).map((e,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:13}}>{e.summary}</div><div style={{fontSize:11,color:PALETTE.muted}}>{e.dtstart} → {e.dtend}</div></div>
              <div style={{background:PALETTE.coral,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{e.nights}n</div>
            </div>
          ))}
          {icalEvents.filter(e=>e.dtend>=today).length===0&&<div style={{color:PALETTE.muted,fontSize:13,textAlign:"center",padding:20}}>No upcoming bookings</div>}
        </div>
      </div>
    );
  };

  const tabs=[{id:"dashboard",icon:"🏝️",label:"Home"},{id:"calendar",icon:"📅",label:"Calendar"},{id:"income",icon:"💰",label:"Income"},{id:"expenses",icon:"📋",label:"Expenses"},{id:"ai",icon:"🤖",label:"AI"}];

  if(loading)return(
    <div style={{minHeight:"100vh",background:PALETTE.sand,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>🌴</div>
      <div style={{color:PALETTE.teal,fontWeight:600,fontSize:16}}>Loading Poolside Paradise...</div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:PALETTE.sand,fontFamily:"'DM Sans',system-ui,sans-serif",color:PALETTE.dark,maxWidth:480,margin:"0 auto",paddingBottom:80}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{background:`linear-gradient(135deg,${PALETTE.tealDark} 0%,${PALETTE.teal} 60%,${PALETTE.tealLight} 100%)`,padding:"28px 20px 20px",color:"#fff"}}>
        <div style={{fontSize:22,fontFamily:"Playfair Display, serif",fontWeight:700}}>🌴 Poolside Paradise</div>
        <div style={{fontSize:12,opacity:0.75,marginTop:2}}>{filterMode==="all"?"All time":MONTH_NAMES[filterMonth]+" "+filterYear}</div>
      </div>

      <div style={{padding:"18px 16px"}}>

        {(tab==="dashboard"||tab==="income"||tab==="expenses")&&<MonthBar/>}

        {tab==="dashboard"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <StatCard label="Total Income" value={fmt(totalIncome)} sub={`${filteredIncome.length} bookings`} color={PALETTE.teal}/>
              <StatCard label="Expenses" value={fmt(totalExpenses)} sub={`${filteredExpenses.length} items`} color={PALETTE.coral}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <StatCard label="Net Profit" value={fmt(netProfit)} color={netProfit>=0?PALETTE.tealDark:PALETTE.coral}/>
              <StatCard label="Cindy 30%" value={fmt(cindyShare)} sub="Partner" color={PALETTE.gold}/>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:12}}>
              <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10}}>Owner Split</div>
              {[["Harry & Lily (70%)",fmt(ownerShare),PALETTE.teal],["Cindy (30%)",fmt(cindyShare),PALETTE.gold]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f0f0f0"}}>
                  <span style={{fontSize:13,color:PALETTE.muted}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:16}}>
              <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,marginBottom:10}}>Expenses by Category</div>
              {catBreakdown.length===0&&<div style={{color:PALETTE.muted,fontSize:13}}>No expenses this period</div>}
              {catBreakdown.map(({cat,total})=>(
                <div key={cat} style={{display:"flex",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,color:PALETTE.muted,width:100}}>{cat}</div>
                  <div style={{flex:1,height:7,background:"#eef4f4",borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:`${Math.round((total/totalExpenses)*100)}%`,height:"100%",background:PALETTE.teal,borderRadius:4}}/>
                  </div>
                  <div style={{fontSize:12,fontWeight:600,marginLeft:8,width:50,textAlign:"right"}}>{fmt(total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="calendar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18}}>Airbnb Calendar</div>
              <Btn onClick={fetchIcal} small color={PALETTE.tealDark}>↻ Sync</Btn>
            </div>
            {icalLoading&&<div style={{textAlign:"center",padding:40,color:PALETTE.muted}}><div style={{fontSize:32,marginBottom:10}}>⏳</div>Đang tải lịch...</div>}
            {icalError&&<div style={{background:"#fff0ee",borderRadius:12,padding:14,color:PALETTE.coral,marginBottom:12,fontSize:13}}>⚠️ {icalError}</div>}
            {!icalLoading&&<div style={{background:"#fff",borderRadius:16,padding:16}}>{renderCalendar()}</div>}
          </div>
        )}

        {tab==="income"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18}}>Income</div>
              <Btn onClick={()=>setShowIncForm(v=>!v)} small>+ Add</Btn>
            </div>
            {showIncForm&&<IncomeForm onSave={handleAddIncome} onCancel={cancelInc} saving={saving}/>}
            {filteredIncome.map(r=>(
              <div key={r.id} style={{background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:600}}>{r.guest||"—"}</div><div style={{fontSize:12,color:PALETTE.muted}}>{r.date} · {r.nights}n · {r.platform}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontWeight:700,color:PALETTE.teal}}>{fmt(r.amount)}</div>
                  <button onClick={()=>handleDelIncome(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:PALETTE.coral,fontSize:16}}>✕</button>
                </div>
              </div>
            ))}
            {filteredIncome.length===0&&<div style={{color:PALETTE.muted,fontSize:13,textAlign:"center",padding:30}}>No income this period</div>}
          </div>
        )}

        {tab==="expenses"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18}}>Expenses</div>
              <Btn onClick={()=>setShowExpForm(v=>!v)} small>+ Add</Btn>
            </div>
            {showExpForm&&<ExpenseForm onSave={handleAddExpense} onCancel={cancelExp} saving={saving}/>}
            {filteredExpenses.map(e=>(
              <div key={e.id} style={{background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:600}}>{e.category}</div><div style={{fontSize:12,color:PALETTE.muted}}>{e.date} · {e.note} · {e.by}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontWeight:700,color:PALETTE.coral}}>{fmt(e.amount)}</div>
                  <button onClick={()=>handleDelExpense(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:PALETTE.coral,fontSize:16}}>✕</button>
                </div>
              </div>
            ))}
            {filteredExpenses.length===0&&<div style={{color:PALETTE.muted,fontSize:13,textAlign:"center",padding:30}}>No expenses this period</div>}
          </div>
        )}

        {tab==="ai"&&(
          <div>
            <div style={{fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:18,marginBottom:4}}>AI Assistant</div>
            <div style={{fontSize:12,color:PALETTE.muted,marginBottom:12}}>Hỏi về tài chính theo tháng — EN hoặc VI</div>
            <div style={{background:"#fff",borderRadius:16,padding:14,minHeight:320,maxHeight:420,overflowY:"auto",marginBottom:12}}>
              {aiHistory.length===0&&<div style={{color:PALETTE.muted,fontSize:13,textAlign:"center",marginTop:60}}>💬 "Báo cáo tháng 6"<br/>"Tháng 2 lợi nhuận bao nhiêu?"</div>}
              {aiHistory.map((m,i)=>(
                <div key={i} style={{marginBottom:10,display:"flex",flexDirection:m.role==="user"?"row-reverse":"row"}}>
                  <div style={{maxWidth:"82%",padding:"10px 13px",borderRadius:14,background:m.role==="user"?PALETTE.teal:"#f0f5f5",color:m.role==="user"?"#fff":PALETTE.dark,fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap"}}>{m.content}</div>
                </div>
              ))}
              {aiLoading&&<div style={{color:PALETTE.muted,fontSize:13}}>⏳ Đang trả lời...</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input style={{...inputStyle,flex:1}} placeholder="Vd: Báo cáo tháng 6..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()}/>
              <Btn onClick={askAI}>Gửi</Btn>
            </div>
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #e8efef",display:"flex",justifyContent:"space-around",padding:"8px 0",zIndex:100}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px",color:tab===t.id?PALETTE.teal:PALETTE.muted,fontWeight:tab===t.id?700:400}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:10}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
