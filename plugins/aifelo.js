const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "felo",
  desc: "Ask AI questions or get summarized answers with sources using Felo AI.",
  category: "ai",
  react: "🧠",
  filename: __filename
},
async (conn, mek, m, { text, q, reply }) => {
  try {
    // Accept input from direct text, q (args joined) or quoted text
    const input = q || text || (m.quoted && (m.quoted.text || (m.quoted.message && m.quoted.message.conversation)));
    if (!input) {
      return reply(
        "🧠 *Usage Example:*\n\n" +
        ".felo Tell me about the history of Jakarta.\n\n" +
        "Get structured, AI-powered answers with sources."
      );
    }

    await reply("⏳ Fetching answer from Felo AI...");

    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/ai/felo?query=${encodeURIComponent(input)}`;
    const res = await axios.get(apiUrl, { timeout: 30000 });

    if (!res || !res.data) {
      return reply("❌ No response from Felo API. Try again later.");
    }

    // If API indicates failure
    if (res.data.status === false) {
      const err = res.data.error || res.data.message || JSON.stringify(res.data);
      return reply(`❌ API error:\n${err}`);
    }

    // The useful payload may be in res.data.data, res.data.response, res.data.answer, etc.
    const payload = res.data.data ?? res.data.response ?? res.data.answer ?? res.data;

    // Helper to extract a readable string from the payload
    const extractText = (p) => {
      if (!p && p !== 0) return "";
      if (typeof p === "string") return p;
      if (Array.isArray(p)) {
        // join array of strings or objects
        return p.map(item => {
          if (typeof item === "string") return item;
          if (typeof item === "object") {
            // try common fields
            return item.text || item.answer || item.content || JSON.stringify(item);
          }
          return String(item);
        }).join("\n\n");
      }
      if (typeof p === "object") {
        // try common object fields in order
        return p.answer
          ?? p.text
          ?? p.content
          ?? p.summary
          ?? p.message
          ?? (p.data ? extractText(p.data) : null)
          ?? JSON.stringify(p, null, 2);
      }
      return String(p);
    };

    const answerText = extractText(payload).trim() || "⚠️ No textual answer returned by the API.";

    // Extract sources if available (array of strings or objects)
    let sources = [];
    if (res.data.sources) sources = res.data.sources;
    else if (payload && payload.sources) sources = payload.sources;
    else if (res.data.data && res.data.data.sources) sources = res.data.data.sources;

    // Format sources
    let sourcesText = "";
    if (Array.isArray(sources) && sources.length) {
      sourcesText = "\n\n📚 *Sources:*\n";
      sources.forEach((s, i) => {
        if (!s) return;
        if (typeof s === "string") {
          sourcesText += `${i + 1}. ${s}\n`;
        } else if (typeof s === "object") {
          // handle { title, url } or { source, link }
          const title = s.title || s.name || s.source || s.label || "";
          const url = s.url || s.link || s.href || "";
          sourcesText += `${i + 1}. ${title ? title + (url ? ` (${url})` : "") : (url || JSON.stringify(s))}\n`;
        } else {
          sourcesText += `${i + 1}. ${String(s)}\n`;
        }
      });
    }

    const finalMsg =
      `🧠 *Felo AI Response*\n\n${answerText}${sourcesText}\n~ TEDDY-XMD`;

    // Send the formatted response
    await conn.sendMessage(m.chat, { text: finalMsg }, { quoted: mek });

  } catch (err) {
    console.error("FeloAI Command Error:", err && err.stack ? err.stack : err);
    // Give a friendly error without crashing
    if (err.code === "ECONNABORTED") return reply("❌ Request timed out. Please try again later.");
    return reply("❌ Failed to connect to Felo API. Please try again later.");
  }
});
