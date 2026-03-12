const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "currency",
  desc: "Convert between fiat and cryptocurrencies in real-time.",
  category: "tools",
  react: "💱",
  filename: __filename
},
async (conn, mek, m, { text, args, reply }) => {
  try {
    if (args.length < 3) {
      return reply(
        "💱 *Usage Example:*\n\n" +
        ".convert 100 USD IDR\n\n" +
        "Converts 100 USD to Indonesian Rupiah (IDR)."
      );
    }

    const [amount, from, to] = args;
    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/currency/convert?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    await reply("💹 Fetching latest conversion rates...");

    const res = await axios.get(apiUrl, { timeout: 15000 });

    if (!res || !res.data) {
      return reply("❌ No response from Currency API. Please try again later.");
    }

    if (res.data.status === false) {
      const err = res.data.error || "Conversion failed.";
      return reply(`❌ *API Error:* ${err}`);
    }

    const data = res.data.data;
    const resultText = 
`💱 *Currency Conversion Result*

💰 *Amount:* ${data.amount} ${data.from}
➡️ *Converted To:* ${data.to}
📈 *Exchange Rate:* ${data.rate.toLocaleString()}
💵 *Result:* ${data.result.toLocaleString()} ${data.to}

⏰ *Updated:* ${new Date(data.timestamp).toLocaleString()}

~ TEDDY-XMD`;

    await conn.sendMessage(m.chat, { text: resultText }, { quoted: mek });

  } catch (err) {
    console.error("Currency Convert Error:", err);
    if (err.code === "ECONNABORTED") return reply("❌ Request timed out. Please try again later.");
    return reply("❌ Failed to connect to Currency API. Please try again later.");
  }
});
