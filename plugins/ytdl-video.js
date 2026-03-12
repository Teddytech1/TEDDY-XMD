const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "video",
    alias: ["ytvideo", "ytmp4", "ytv"],
    desc: "Download YouTube video using JawadTech API",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.video pal pal`");

        // Function to check if it's a YouTube URL
        function isYouTubeUrl(text) {
            return text.includes("youtube.com") || text.includes("youtu.be");
        }

        // Function to extract video ID from various YouTube URL formats
        function getVideoId(url) {
            let videoId = null;
            
            // youtube.com/watch?v=VIDEO_ID
            if (url.includes("youtube.com/watch")) {
                const match = url.match(/[?&]v=([^&\s]+)/);
                if (match) videoId = match[1];
            }
            // youtu.be/VIDEO_ID
            else if (url.includes("youtu.be/")) {
                const match = url.match(/youtu\.be\/([^?\s&]+)/);
                if (match) videoId = match[1];
            }
            // youtube.com/shorts/VIDEO_ID
            else if (url.includes("youtube.com/shorts/")) {
                const match = url.match(/shorts\/([^?\s&]+)/);
                if (match) videoId = match[1];
            }
            // youtube.com/embed/VIDEO_ID
            else if (url.includes("youtube.com/embed/")) {
                const match = url.match(/embed\/([^?\s&]+)/);
                if (match) videoId = match[1];
            }
            // youtube.com/v/VIDEO_ID
            else if (url.includes("youtube.com/v/")) {
                const match = url.match(/\/v\/([^?\s&]+)/);
                if (match) videoId = match[1];
            }
            // youtube.com/live/VIDEO_ID
            else if (url.includes("youtube.com/live/")) {
                const match = url.match(/live\/([^?\s&]+)/);
                if (match) videoId = match[1];
            }
            
            return videoId;
        }

        let url = q;
        let videoInfo = null;

        // Detect if it's a URL or a title
        if (isYouTubeUrl(q)) {
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            // Search for video info using videoId
            const searchResult = await yts({ videoId: videoId });
            if (!searchResult) {
                return await reply("❌ Could not fetch video information!");
            }
            videoInfo = searchResult;
            
            // Make sure we have a proper URL for API
            url = `https://www.youtube.com/watch?v=${videoId}`;
            
        } else {
            const search = await yts(q);
            if (!search.videos || search.videos.length === 0) {
                return await reply("❌ No results found!");
            }
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        // Send thumbnail + details before downloading
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `🎬 *${videoInfo.title}*\n⏰ *Duration:* ${videoInfo.timestamp}\n👁️ *Views:* ${videoInfo.views}\n\n⏳ *Downloading, please wait...*`
        }, { quoted: mek });

        // Call JawadTech API
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api);
        const data = res.data;

        // Check API response
        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link from API!");
        }

        const { title, mp4 } = data.result;

        // Send the video
        await conn.sendMessage(from, {
            video: { url: mp4 },
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: `🎬 *${title}*\n> ✅ Download completed successfully!\n\n> *TEDDY-XMD*`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("❌ Error in .video command:", err);
        await reply("⚠️ Something went wrong while downloading the video!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
