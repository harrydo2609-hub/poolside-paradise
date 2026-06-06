const BASEROW_TOKEN = "b1h57YWuDyi8HmyyNtpBor7Baupcgu3b";
const BASE = "https://api.baserow.io/api";
const CHI_PHI_ID = 973222;
const THU_NHAP_ID = 973227;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const headers = { Authorization: `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" };

  try {
    // GET expenses
    if (action === "get_expenses") {
      const r = await fetch(`${BASE}/database/rows/table/${CHI_PHI_ID}/?user_field_names=true&size=200`, { headers });
      const data = await r.json();
      const rows = (data.results || []).map(row => ({
        id: row.id,
        date: row.Date ? row.Date.split("T")[0] : "",
        category: row.Category || "",
        amount: parseFloat(row.Amount) || 0,
        note: row.Notes || "",
        by: row.Name || "",
      }));
      return res.status(200).json(rows);
    }

    // GET income
    if (action === "get_income") {
      const r = await fetch(`${BASE}/database/rows/table/${THU_NHAP_ID}/?user_field_names=true&size=200`, { headers });
      const data = await r.json();
      const rows = (data.results || []).map(row => ({
        id: row.id,
        date: row.Date ? row.Date.split("T")[0] : "",
        amount: parseFloat(row.Amount) || 0,
        nights: parseInt(row.Nights) || 1,
        guest: row.Name || "",
        platform: row.Notes || "Airbnb",
      }));
      return res.status(200).json(rows);
    }

    // ADD expense
    if (action === "add_expense" && req.method === "POST") {
      const { date, category, amount, note, by } = req.body;
      const r = await fetch(`${BASE}/database/rows/table/${CHI_PHI_ID}/?user_field_names=true`, {
        method: "POST", headers,
        body: JSON.stringify({ Name: by, Date: date, Category: category, Amount: amount, Notes: note }),
      });
      const data = await r.json();
      return res.status(200).json({ id: data.id, date, category, amount, note, by });
    }

    // ADD income
    if (action === "add_income" && req.method === "POST") {
      const { date, amount, nights, guest, platform } = req.body;
      const r = await fetch(`${BASE}/database/rows/table/${THU_NHAP_ID}/?user_field_names=true`, {
        method: "POST", headers,
        body: JSON.stringify({ Name: guest, Date: date, Amount: amount, Nights: nights, Notes: platform }),
      });
      const data = await r.json();
      return res.status(200).json({ id: data.id, date, amount, nights, guest, platform });
    }

    // DELETE expense
    if (action === "del_expense" && req.method === "POST") {
      const { id } = req.body;
      await fetch(`${BASE}/database/rows/table/${CHI_PHI_ID}/${id}/`, { method: "DELETE", headers });
      return res.status(200).json({ ok: true });
    }

    // DELETE income
    if (action === "del_income" && req.method === "POST") {
      const { id } = req.body;
      await fetch(`${BASE}/database/rows/table/${THU_NHAP_ID}/${id}/`, { method: "DELETE", headers });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
