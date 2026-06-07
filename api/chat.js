const BASEROW_TOKEN = "b1h57YWuDyi8HmyyNtpBor7Baupcgu3b";
const BASE = "https://api.baserow.io/api";
const CHI_PHI_ID = 973222;
const THU_NHAP_ID = 973227;

const baserowHeaders = {
  Authorization: `Token ${BASEROW_TOKEN}`,
  "Content-Type": "application/json",
};

const tools = [
  {
    name: "add_expense",
    description: "Add a single expense record.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format. Use today if not specified." },
        category: { type: "string", enum: ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"] },
        amount: { type: "number", description: "Amount in USD" },
        note: { type: "string", description: "Brief description" },
        by: { type: "string", description: "Who paid. Default: Harry" },
      },
      required: ["date", "category", "amount"],
    },
  },
  {
    name: "add_multiple_expenses",
    description: "Add multiple expense records at once. Use when user mentions recurring expenses (weekly, every Thursday, every month), or wants to add expenses for multiple dates. ALWAYS use this instead of asking for clarification when user says 'every week', 'mỗi tuần', 'hàng tuần', 'mỗi tháng'. Calculate the dates yourself based on current date and context.",
    input_schema: {
      type: "object",
      properties: {
        expenses: {
          type: "array",
          description: "List of expenses to add",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Date in YYYY-MM-DD format" },
              category: { type: "string", enum: ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"] },
              amount: { type: "number" },
              note: { type: "string" },
              by: { type: "string" },
            },
            required: ["date", "category", "amount"],
          },
        },
      },
      required: ["expenses"],
    },
  },
  {
    name: "add_income",
    description: "Add a new income/booking record.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
        amount: { type: "number" },
        nights: { type: "number" },
        guest: { type: "string" },
        platform: { type: "string", enum: ["Airbnb","VRBO","Direct","Other"] },
      },
      required: ["date", "amount"],
    },
  },
];

function normalizeDate(d) {
  if (!d) return new Date().toISOString().split("T")[0];
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // DD/MM/YYYY
  const m1 = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`;
  // MM/DD/YYYY
  const m2 = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2,"0")}-${m2[2].padStart(2,"0")}`;
  // Try native parse
  try { return new Date(d).toISOString().split("T")[0]; } catch { return new Date().toISOString().split("T")[0]; }
}

async function runTool(name, input) {
  const today = new Date().toISOString().split("T")[0];

  if (name === "add_expense") {
    const { date, category = "Other", amount, note = "", by = "Harry" } = input;
    const normalDate = normalizeDate(date || today);
    input.date = normalDate;
    const r = await fetch(`${BASE}/database/rows/table/${CHI_PHI_ID}/?user_field_names=true`, {
      method: "POST", headers: baserowHeaders,
      body: JSON.stringify({ Name: by, Date: normalDate, Category: category, Amount: amount, Notes: note }),
    });
    const data = await r.json();
    return { success: true, id: data.id, date: normalDate, category, amount, note, by };
  }

  if (name === "add_multiple_expenses") {
    const { expenses } = input;
    const results = [];
    for (const exp of expenses) {
      const nd = normalizeDate(exp.date);
      const r = await fetch(`${BASE}/database/rows/table/${CHI_PHI_ID}/?user_field_names=true`, {
        method: "POST", headers: baserowHeaders,
        body: JSON.stringify({ Name: exp.by || "Harry", Date: nd, Category: exp.category || "Other", Amount: exp.amount, Notes: exp.note || "" }),
      });
      const d = await r.json();
      results.push({ id: d.id, date: nd, category: exp.category, amount: exp.amount, note: exp.note || "", by: exp.by || "Harry" });
    }
    return { success: true, count: results.length, records: results };
  }

  if (name === "add_income") {
    const { date, amount, nights = 1, guest = "", platform = "Airbnb" } = input;
    const normalDate2 = normalizeDate(date || today);
    input.date = normalDate2;
    const r = await fetch(`${BASE}/database/rows/table/${THU_NHAP_ID}/?user_field_names=true`, {
      method: "POST", headers: baserowHeaders,
      body: JSON.stringify({ Name: guest, Date: normalDate2, Amount: amount, Nights: nights, Notes: platform }),
    });
    const data = await r.json();
    return { success: true, id: data.id, date: normalDate2, amount, nights, guest, platform };
  }

  return { success: false, error: "Unknown tool" };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { model, max_tokens, messages } = req.body;
    let { system } = req.body;
    // Inject today's date and day info so AI can calculate recurring dates
    const now = new Date();
    const todayInfo = `Today is ${now.toISOString().split("T")[0]} (${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()]}). Current month has days 1-${new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()}. When user says recurring expenses (every week, mỗi tuần, hàng tuần), calculate ALL dates for the current month and use add_multiple_expenses tool. Never ask for clarification on dates - calculate them yourself.`;
    system = system ? system + "\n\n" + todayInfo : todayInfo;

    // First call — may use tools
    const response1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, system, messages, tools }),
    });

    const data1 = await response1.json();

    // Check if AI wants to use a tool
    const toolUseBlock = data1.content?.find(b => b.type === "tool_use");

    if (toolUseBlock) {
      // Run the tool
      const toolResult = await runTool(toolUseBlock.name, toolUseBlock.input);
      // For multiple expenses, attach records to result
      if (toolUseBlock.name === "add_multiple_expenses" && toolResult.records) {
        toolResult.allRecords = toolResult.records;
      }

      // Second call — tell AI the result
      const messages2 = [
        ...messages,
        { role: "assistant", content: data1.content },
        {
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          }],
        },
      ];

      const response2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens, system, messages: messages2, tools }),
      });

      const data2 = await response2.json();

      // Return final response + action info for app to refresh data
      return res.status(200).json({
        ...data2,
        action: { tool: toolUseBlock.name, input: toolUseBlock.input, result: toolResult },
      });
    }

    return res.status(200).json(data1);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
