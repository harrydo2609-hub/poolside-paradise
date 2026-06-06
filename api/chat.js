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
    description: "Add a new expense record. Use when user says they want to add/record an expense, cost, or payment.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format. Use today if not specified." },
        category: { type: "string", enum: ["Cleaning","Maintenance","Supplies","Utilities","Mortgage","Insurance","Marketing","Other"], description: "Expense category" },
        amount: { type: "number", description: "Amount in USD" },
        note: { type: "string", description: "Brief description of the expense" },
        by: { type: "string", description: "Who paid. Default: Harry" },
      },
      required: ["date", "category", "amount"],
    },
  },
  {
    name: "add_income",
    description: "Add a new income/booking record. Use when user says they want to add income, a booking, or revenue.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
        amount: { type: "number", description: "Amount in USD" },
        nights: { type: "number", description: "Number of nights" },
        guest: { type: "string", description: "Guest name" },
        platform: { type: "string", enum: ["Airbnb","VRBO","Direct","Other"], description: "Booking platform" },
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
    const { model, max_tokens, system, messages } = req.body;

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
