const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

cmd({
    pattern: "song2",
    alias: ["play2", "mp32", "audio2"],
    react: "🎶",
    desc: "Download YouTube song using PrivateZia API",
    category: "main",
    use: '.song <song name>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("Please provide a song name.");

        const processingMsg = await reply(`> *SEARCHING SONG* *${q}*...`);

        // API Request
        const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytplaymp3?query=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!res.data || !res.data.status || !res.data.result) {
            return reply("❌ Failed to fetch song. Please try again.");
        }

        const { title, thumbnail, duration, downloadUrl, quality, videoUrl } = res.data.result;

        // Temporary file path
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempFile = path.join(tempDir, `song_${Date.now()}.mp3`);

        // Download audio
        const audioResponse = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        await pipeline(audioResponse.data, fs.createWriteStream(tempFile));

        const audioBuffer = fs.readFileSync(tempFile);

        // Send audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.length > 25 ? `${title.substring(0, 22)}...` : title,
                    body: `🎶 ${quality.toUpperCase()} | Duration: ${duration}s\nTEDDY-XMD`,
                    mediaType: 1,
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoUrl,
                    showAdAttribution: false,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Cleanup
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch { }

    } catch (error) {
        console.error("Error:", error);
        reply("❌ Something went wrong. Please try again later.");
    }
});
