
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { system, messages } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Sorry, no response.';
    res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    res.status(500).json({ error: 'Groq API failed', detail: err.message });
  }
}