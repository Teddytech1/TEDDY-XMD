const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "snack",
  alias: ["snackvideo", "snackdl", "kvideo"],
  desc: "Download videos from SnackVideo",
  react: "🎬",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q) return reply("> *😈 Please provide a valid SnackVideo URL.*");

    // Show working reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // Working API
    const apiURL = `https://api.deline.web.id/downloader/snackvideo?url=${encodeURIComponent(q)}`;

    let data;
    try {
      const apiResp = await axios.get(apiURL, { 
        timeout: 30000, 
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      data = apiResp.data;
      console.log("API Response:", JSON.stringify(data, null, 2));
    } catch (apiErr) {
      console.error("API Request Failed:", apiErr.message);
      return reply("❌ Failed to connect to API. Please try again.");
    }

    // Check status (handle both boolean and string)
    if (data.status === false || data.status === "false") {
      return reply("⚠️ API returned an error. Please check your URL.");
    }

    // Extract video URL - multiple methods
    let videoUrl = null;
    
    if (data.result && data.result.video) {
      videoUrl = data.result.video;
    } else if (data.result && typeof data.result === "string") {
      videoUrl = data.result;
    } else if (data.video) {
      videoUrl = data.video;
    } else if (data.url) {
      videoUrl = data.url;
    }

    if (!videoUrl) {
      console.error("Full API Response:", data);
      return reply("⚠️ No video URL found in response.");
    }

    console.log("Video URL Found:", videoUrl);

    // Update reaction
    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    // Download video buffer
    let videoBuffer = null;
    try {
      const videoResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxRedirects: 10,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Referer": "https://www.snackvideo.com/"
        }
      });

      videoBuffer = Buffer.from(videoResp.data);
      const sizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
      console.log(`✅ Video Downloaded: ${sizeMB} MB`);

    } catch (dlErr) {
      console.error("Download Error:", dlErr.message);
    }

    // Caption
    const caption = `╭━━━〔 *SNACKVIDEO DL* 〕━━━⊷
┃▸ *Status:* Success ✅
┃▸ *Creator:* ${data.creator || "Teddy"}
╰━━━⪼

> 📥 *TEDDY-XMD*`;

    // Send video
    if (videoBuffer && videoBuffer.length > 1000) {
      try {
        await conn.sendMessage(from, {
          video: videoBuffer,
          mimetype: "video/mp4",
          fileName: "snackvideo.mp4",
          caption: caption
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        return;
      } catch (e) {
        console.error("Send Error:", e.message);
      }
    }

    // Fallback: Send as document
    try {
      await conn.sendMessage(from, {
        document: { url: videoUrl },
        mimetype: "video/mp4",
        fileName: "snackvideo.mp4",
        caption: caption
      }, { quoted: m });

      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
      return;
    } catch (e) {
      console.error("Document Send Error:", e.message);
    }

    // Final fallback: Send link
    await reply(`📥 *Download Link:*\n\n${videoUrl}`);

  } catch (error) {
    console.error("Main Error:", error);
    await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    reply("❌ An error occurred. Please try again.");
  }
});
