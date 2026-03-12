const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "wastatus",
    alias: ["wstatus", "whatsappstatus", "wsstatus", "ws"],
    desc: "Download WhatsApp Status videos by category",
    category: "download",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // Categories with search queries for short status videos
        const categories = {
            "islam": [
                "islamic whatsapp status short",
                "quran status video 30 sec",
                "islamic reminder status",
                "allah status video short",
                "naat status video",
                "islamic quotes status",
                "jumma mubarak status"
            ],
            "sad": [
                "sad whatsapp status",
                "sad song status 30 sec",
                "broken heart status",
                "sad poetry status urdu",
                "emotional sad status",
                "sad shayari status",
                "tanha status video"
            ],
            "song": [
                "hindi song whatsapp status",
                "punjabi song status 30 sec",
                "indian song status",
                "bollywood status video",
                "romantic song status",
                "new hindi song status",
                "trending song status"
            ],
            "motivation": [
                "motivation whatsapp status",
                "motivational quotes status",
                "success motivation status short",
                "gym motivation status",
                "life motivation status",
                "study motivation status",
                "never give up status"
            ],
            "love": [
                "love whatsapp status",
                "romantic status video 30 sec",
                "couple status video",
                "love song status",
                "romantic whatsapp status",
                "true love status"
            ],
            "funny": [
                "funny whatsapp status",
                "comedy status video short",
                "funny video status",
                "memes status video",
                "comedy whatsapp status"
            ],
            "attitude": [
                "attitude whatsapp status",
                "attitude status video",
                "boy attitude status",
                "girl attitude status",
                "savage attitude status",
                "killer attitude status"
            ],
            "friendship": [
                "friendship whatsapp status",
                "friends status video",
                "dosti status",
                "best friend status",
                "yaari status video"
            ],
            "nature": [
                "nature whatsapp status",
                "beautiful nature status",
                "rain status video",
                "sunset status video",
                "nature aesthetic status"
            ]
        };

        // Show available categories if no input
        if (!q) {
            let categoryList = Object.keys(categories).map((cat, index) => `${index + 1}. *${cat.toUpperCase()}*`).join('\n');
            return await reply(`📱 *WHATSAPP STATUS DOWNLOADER*\n━━━━━━━━━━━━━━━━━━━━━\n\n📂 *Available Categories:*\n\n${categoryList}\n\n━━━━━━━━━━━━━━━━━━━━━\n📝 *Usage:* .status <category>\n📌 *Example:* .status islam\n📌 *Example:* .status motivation\n\n> *TEDDY-XMD*`);
        }

        const category = q.toLowerCase().trim();

        // Check if category exists
        if (!categories[category]) {
            let categoryList = Object.keys(categories).map((cat, index) => `${index + 1}. *${cat.toUpperCase()}*`).join('\n');
            return await reply(`❌ *Invalid Category!*\n\n📂 *Available Categories:*\n\n${categoryList}\n\n📌 *Example:* .status sad`);
        }

        // React to show processing
        await conn.sendMessage(from, { react: { text: '🔍', key: m.key } });

        // Get random search query from category
        const searchQueries = categories[category];
        const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

        // Search for videos
        const search = await yts(randomQuery);
        if (!search.videos || search.videos.length === 0) {
            return await reply("❌ No videos found for this category!");
        }

        // Filter short videos (under 60 seconds for WhatsApp status)
        const shortVideos = search.videos.filter(video => {
            const duration = video.seconds;
            return duration <= 60 && duration >= 5; // 5 to 60 seconds ideal for status
        });

        let videoInfo;

        if (shortVideos.length === 0) {
            // If no short videos found, take from first 15 results
            videoInfo = search.videos[Math.floor(Math.random() * Math.min(15, search.videos.length))];
        } else {
            // Get random short video from filtered list
            videoInfo = shortVideos[Math.floor(Math.random() * Math.min(10, shortVideos.length))];
        }

        // Get category emoji
        const categoryEmojis = {
            "islam": "🕌",
            "sad": "😢",
            "song": "🎵",
            "motivation": "💪",
            "love": "❤️",
            "funny": "😂",
            "attitude": "😎",
            "friendship": "👬",
            "nature": "🌿"
        };

        const emoji = categoryEmojis[category] || "📱";

        // Send thumbnail + details before downloading
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `${emoji} *WHATSAPP STATUS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎬 *Title:* ${videoInfo.title}\n\n⏰ *Duration:* ${videoInfo.timestamp}\n👁️ *Views:* ${videoInfo.views}\n📁 *Category:* ${category.toUpperCase()}\n\n⏳ *Downloading, please wait...*\n\n> *TEDDY-XMD*`
        }, { quoted: mek });

        // React to show downloading
        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        // Call JawadTech API for download
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoInfo.url)}`;
        const res = await axios.get(api);
        const data = res.data;

        // Check API response
        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link from API!");
        }

        const { mp4 } = data.result;

        // Send the video
        await conn.sendMessage(from, {
            video: { url: mp4 },
            mimetype: 'video/mp4',
            fileName: `${category}_status.mp4`,
            caption: `${emoji} *${category.toUpperCase()} STATUS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎬 *${videoInfo.title}*\n\n✅ *Download Complete!*\n\n> *TEDDY-XMD*`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("❌ Error in .status command:", err);
        await reply("⚠️ Something went wrong while downloading the status video!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
