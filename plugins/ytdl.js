const axios = require("axios");
const yts = require("yt-search");
const config = require("../config");
const { cmd } = require("../command");

cmd({
  pattern: "play3",
  alias: ["song3", "music3"],   
  desc: "Download YouTube audio by title",
  category: "download",
  react: "🎵",
  filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
  try {
    if (!q) return reply("❌ Please give me a song name.");

    // 1. Search video on YouTube
    let search = await yts(q);
    let video = search.videos[0];
    if (!video) return reply("❌ No results found.");

    // 2. Call your API with video URL
    let apiUrl = `https://jawad-tech.vercel.app/download/yt?url=${encodeURIComponent(video.url)}`;
    let res = await axios.get(apiUrl);

    if (!res.data.status) {
      return reply("❌ Failed to fetch audio. Try again later.");
    }

    // 3. Send audio file first
    await conn.sendMessage(from, {
      audio: { url: res.data.result },
      mimetype: "audio/mpeg",
      ptt: false,
      contextInfo: { forwardingScore: 999, isForwarded: true }
    }, { quoted: mek });

    // 4. Then reply with success message (New Different Design)
    await reply(`━━━━━━━━━━━━━━━━━━━━
🎵  𝐀𝐔𝐃𝐈𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐃  🎵
━━━━━━━━━━━━━━━━━━━━
📄 𝐓𝐈𝐓𝐋𝐄: ${video.title}
⏰ 𝐃𝐔𝐑𝐀𝐓𝐈𝐎𝐍: ${video.timestamp}
👀 𝐕𝐈𝐄𝐖𝐒: ${video.views}
━━━━━━━━━━━━━━━━━━━━
✅ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞𝐝!
━━━━━━━━━━━━━━━━━━━━`);

  } catch (e) {
    console.error("play2 error:", e);
    reply("❌ Error while downloading audio.");
  }
});
