const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "spotifyplay",
    alias: ["sp", "spotifydl", "splay", "spmusic"],
    desc: "Download Spotify audio",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .spotify Sparks Coldplay");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Call Spotify API
        const api = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(q)}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json?.status || !json?.result) {
            return await reply("❌ No results found! Try another song name.");
        }

        const { metadata, dlink } = json.result;
        const { title, artist, duration, cover, url } = metadata;

        // Send cover image with info
        await conn.sendMessage(from, {
            image: { url: cover },
            caption: `> SPOTIFY DOWNLOADER 🎵\n\n*SPOTIFY AUDIO DOWNLOADER*\n╭━━━━━━━━━━━━━━━━╮\n┇๏ *Title* - ${title}\n┇๏ *Artist* - ${artist}\n┇๏ *Duration* - ${duration}\n┇๏ *Link* - ${url}\n┇๏ *Status* - Downloading...\n╰━━━━━━━━━━━━━━━━╯\n\n> *TEDDY-XMD*`
        }, { quoted: mek });

        // Send audio file
        await conn.sendMessage(from, {
            audio: { url: dlink },
            mimetype: "audio/mpeg",
            fileName: `${title} - ${artist}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in Spotify download:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
