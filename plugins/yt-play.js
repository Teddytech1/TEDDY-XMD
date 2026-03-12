const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "music",
    alias: ["play", "song", "audio", "roohi", "ayezal"],
    desc: "Download YouTube audio with thumbnail",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Faded Alan Walker");

        // Faa API
        const api = `https://api-faa.my.id/faa/ytplay?q=${encodeURIComponent(q)}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json.status || !json.result || !json.result.mp3) {
            return await reply("❌ No results found or download failed!");
        }

        const result = json.result;
        const title = result.title || "Unknown Song";
        const thumbnail = result.thumbnail;
        const audioUrl = result.mp3;
        const author = result.author || "Unknown";
        const duration = result.duration || 0;
        const views = result.views || 0;

        // Format duration
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationText = `${mins}:${secs.toString().padStart(2, '0')}`;

        // 🎵 Send thumbnail + info
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `🎧 *AUDIO DOWNLOADER*\n╭━━❐━⪼\n┇๏ *Title* - ${title}\n┇๏ *Author* - ${author}\n┇๏ *Duration* - ${durationText}\n┇๏ *Views* - ${views.toLocaleString()}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *TEDDY-XMD*`
        }, { quoted: mek });

        // 🎧 Send audio
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
