
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, messages } = req.body || {};

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing in Vercel environment variables.",
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid request: messages must be an array.",
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          max_tokens: 1000,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            ...messages,
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", response.status, data);

      return res.status(502).json({
        error:
          data.error?.message ||
          `Groq API request failed with status ${response.status}.`,
      });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error("Groq returned no message content:", data);

      return res.status(502).json({
        error: "Groq returned an empty response.",
      });
    }

    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (err) {
    console.error("Chat API error:", err);

    return res.status(500).json({
      error: "Chat API failed. Check the Vercel runtime logs.",
    });
  }
}
