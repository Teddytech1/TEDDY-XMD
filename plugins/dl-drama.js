const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "drama",
    alias: ["ytDrama", "ytmdrama", "dzdrama"],
    desc: "Download YouTube drama in high quality (Dark Zone MD)",
    category: "download",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply(`
🌸 *DRAMA DOWNLOADER – DARK ZONE MD* 🌸

🎬 Please provide a drama name or YouTube URL!

💡 Example:
\`.drama Kaisi Teri Khudgarzi Episode 1\`
        `);

        let url = q;
        let videoInfo = null;

        // Detect URL or title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be"))
                return await reply("❌ Please provide a valid YouTube drama URL!");
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId: videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q + " drama full episode");
            if (!search.videos || search.videos.length === 0)
                return await reply("😢 No drama found with that name!");
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // Send fancy preview
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `
╔═══════════◇🌙◇═════════╗
     *🎭 DRAMA DOWNLOADER 🎭*
╚═══════════◇🌙◇═════════╝

📺 *Title:* ${videoInfo.title}
🕒 *Duration:* ${videoInfo.timestamp}
👁️ *Views:* ${videoInfo.views.toLocaleString()}
🔗 *Source:* YouTube

⏳ _Fetching download link..._
            `
        }, { quoted: mek });

        // Download via existing API
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api);
        const data = res.data;

        if (!data?.status || !data?.result?.mp4)
            return await reply("⚠️ Could not get the drama file, please try again later!");

        const { title, mp4 } = data.result;

        // Send as a document for faster speed
        await conn.sendMessage(from, {
            document: { url: mp4 },
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: `
✨ *${title}*  
🎬 Your requested drama is ready!

🖤 *Enjoy Watching With*  
『🔥 TEDDY-XMD 🔥』
            `
        }, { quoted: mek });

        // Success react
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("❌ Error in .drama command:", err);
        await reply("⚠️ Oops! Something went wrong while fetching your drama!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
