const BASEROW_TOKEN = "b1h57YWuDyi8HmyyNtpBor7Baupcgu3b";
const BASE = "https://api.baserow.io/api";
const THU_NHAP_ID = 973227;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
    const row = {};
    headers.forEach((h, j) => { row[h] = (vals[j] || "").replace(/"/g, "").trim(); });
    rows.push(row);
  }
  return rows;
}

function convertDate(d) {
  if (!d) return null;
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
  return d;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { csvText } = req.body;
    const rows = parseCSV(csvText);
    const reservations = rows.filter(r => r.Type === "Reservation" && r.Amount);

    // Fetch all existing records to check duplicates
    const existingRes = await fetch(
      `${BASE}/database/rows/table/${THU_NHAP_ID}/?user_field_names=true&size=200`,
      { headers: { Authorization: `Token ${BASEROW_TOKEN}` } }
    );
    const existingData = await existingRes.json();
    const existingNotes = new Set(
      (existingData.results || []).map(r => r.Notes || "").filter(n => n.includes("Airbnb ·"))
    );

    const imported = [], skipped = [];

    for (const r of reservations) {
      const code = r["Confirmation code"] || "";
      const noteKey = `Airbnb · ${code}`;

      // Skip if already exists
      if (code && existingNotes.has(noteKey)) {
        skipped.push({ code, guest: r.Guest });
        continue;
      }

      const date = convertDate(r["Start date"]) || convertDate(r["Date"]);
      const amount = parseFloat(r.Amount) || 0;
      const nights = parseInt(r.Nights) || 1;
      const guest = r.Guest || "";

      if (!date || !amount) continue;

      const resp = await fetch(
        `${BASE}/database/rows/table/${THU_NHAP_ID}/?user_field_names=true`,
        {
          method: "POST",
          headers: { Authorization: `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ Name: guest, Date: date, Amount: amount, Nights: nights, Notes: noteKey }),
        }
      );
      const data = await resp.json();
      imported.push({ id: data.id, date, amount, nights, guest, platform: "Airbnb", code });
    }

    return res.status(200).json({
      imported: imported.length,
      skipped: skipped.length,
      records: imported,
      skippedRecords: skipped,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
