const { fetchJson } = require("../lib/functions");
const { downloadTiktok } = require("@mrnima/tiktok-downloader");
const { facebook } = require("@mrnima/facebook-downloader");
const cheerio = require("cheerio");
const { igdl } = require("ruhend-scraper");
const axios = require("axios");
const { cmd, commands } = require('../command');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐦 Twitter Downloader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
  pattern: "twitter",
  alias: ["tweet", "twdl"],
  desc: "Download Twitter videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Twitter URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve Twitter video. Please check the link and try again.");
    }

    const { desc, thumb, video_sd, video_hd } = data.result;

    const caption = `╭─────────────❐
│ 🐦 *Twitter Video Downloader*
│─────────────────────
│ 💬 *Description:* ${desc || "No description"}
│─────────────────────
│ 🎬 *Choose Quality Below:*
│  1️⃣ SD Quality
│  2️⃣ HD Quality
│─────────────────────
│ 🎧 *Audio Options:*
│  3️⃣ Audio
│  4️⃣ Document
│  5️⃣ Voice Note
╰─────────────❐
💠 *Owner:* TEDDY-XMD 💎`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption: caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, { video: { url: video_sd }, caption: "📥 *Downloaded in SD Quality*" }, { quoted: receivedMsg });
            break;
          case "2":
            await conn.sendMessage(senderID, { video: { url: video_hd }, caption: "📥 *Downloaded in HD Quality*" }, { quoted: receivedMsg });
            break;
          case "3":
            await conn.sendMessage(senderID, { audio: { url: video_sd }, mimetype: "audio/mpeg" }, { quoted: receivedMsg });
            break;
          case "4":
            await conn.sendMessage(senderID, { document: { url: video_sd }, mimetype: "audio/mpeg", fileName: "Twitter_Audio.mp3", caption: "📥 *Audio Downloaded as Document*" }, { quoted: receivedMsg });
            break;
          case "5":
            await conn.sendMessage(senderID, { audio: { url: video_sd }, mimetype: "audio/mp4", ptt: true }, { quoted: receivedMsg });
            break;
          default:
            reply("❌ Invalid option! Please reply with 1, 2, 3, 4, or 5.");
        }
      }
    });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 MediaFire Downloader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 APK Downloader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
  pattern: "apk",
  desc: "Download APK from Aptoide.",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide an app name to search.");

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.datalist || !data.datalist.list.length) {
      return reply("⚠️ No results found for the given app name.");
    }

    const app = data.datalist.list[0];
    const appSize = (app.size / 1048576).toFixed(2);

    const caption = `╭─────────────📱
│ 🧩 *APK DOWNLOADER*
│─────────────────────
│ 📦 *App:* ${app.name}
│ 📏 *Size:* ${appSize} MB
│ 🧑‍💻 *Developer:* ${app.developer.name}
│ 📅 *Updated:* ${app.updated}
╰─────────────📱
🔗 *Powered ByTEDDY-XMD*`;

    await conn.sendMessage(from, {
      document: { url: app.file.path_alt },
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the APK. Please try again.");
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ☁️ Google Drive Downloader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd({
  pattern: "gdrive",
  desc: "Download Google Drive files.",
  react: "☁️",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a valid Google Drive link.");

    await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

    const apiUrl = `https://api.fgmods.xyz/api/downloader/gdrive?url=${q}&apikey=mnp3grlZ`;
    const response = await axios.get(apiUrl);
    const result = response.data.result;

    if (!result || !result.downloadUrl) {
      return reply("⚠️ No download URL found. Please check the link and try again.");
    }

    const caption = `╭─────────────☁️
│ 🧩 *GOOGLE DRIVE DOWNLOADER*
│─────────────────────
│ 📁 *File Name:* ${result.fileName}
│ 🧾 *Type:* ${result.mimetype}
│─────────────────────
│ 📥 *Downloading...*
╰─────────────☁️
💠 *Owner:* TEDDY-XMD 💎`;

    await conn.sendMessage(from, {
      document: { url: result.downloadUrl },
      mimetype: result.mimetype,
      fileName: result.fileName,
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the Google Drive file. Please try again.");
  }
});
