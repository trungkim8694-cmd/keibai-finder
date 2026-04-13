const geminiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/^"|"$/g, '') : '';
async function geocode(address) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const prompt = `Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include markdown. Address: ${address}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
geocode('北海道苫前郡苫前町字古丹別 １７６番３７');
