export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ICAL_URL = "https://www.airbnb.com/calendar/ical/903771582100260470.ics?t=5c6e23eb6a3447e78667ed85879cda9a";

  try {
    const response = await fetch(ICAL_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await response.text();
    res.setHeader('Content-Type', 'text/calendar');
    return res.status(200).send(text);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
