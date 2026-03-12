// plugins/autodl.js
const { cmd } = require("../command");
const config = require('../config');
const axios = require('axios');

// Platform URLs and their APIs
const platforms = {
    youtube: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/gi,
        api: "https://jawad-tech.vercel.app/download/ytdl",
        method: "video"
    },
    facebook: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/gi,
        api: "https://jawad-tech.vercel.app/downloader",
        method: "video"
    },
    instagram: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|tv|reels)\/[^\s\/]+/gi,
        api: "https://api-aswin-sparky.koyeb.app/api/downloader/igdl",
        method: "media"
    },
    tiktok: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/[^\s]+/gi,
        method: "video"
    },
    pinterest: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:pinterest\.com|pin\.it)\/[^\s]+/gi,
        api: "https://jawad-tech.vercel.app/download/pinterest",
        method: "media"
    }
};

// Create caption for downloads
const createCaption = () => {
    return `> *© ${config.BOT_NAME} Auto Downloader*`;
};

// Extract URL from text
const extractUrl = (text, pattern) => {
    if (!text) return null;
    const match = text.match(pattern);
    if (match && match[0]) {
        let url = match[0].trim();
        // Add https if missing
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        return url;
    }
    return null;
};

// No prefix auto-downloader handler
cmd({
    'on': "body"
}, async (client, message, store, {
    from,
    body,
    isGroup,
    isAdmins,
    isBotAdmins,
    isCreator,
    reply,
    sender
}) => {
    try {
        // CHECK IF BODY EXISTS - IMPORTANT FIX
        if (!body || typeof body !== 'string' || body.length < 10) return;

        // Direct check of config.AUTO_DOWNLOADER
        const autoDownload = config.AUTO_DOWNLOADER?.toLowerCase() || "false";
        
        if (autoDownload === "true") {
            // Works for both inbox and groups
        } 
        else if (autoDownload === "inbox") {
            if (isGroup) return;
        } 
        else if (autoDownload === "group") {
            if (!isGroup) return;
        } 
        else if (autoDownload === "owner") {
            if (!isCreator) return;
        } 
        else {
            return; // Disabled
        }
        
        // Check if message contains any platform URL
        let matchedPlatform = null;
        let matchedUrl = null;
        
        for (const [platform, data] of Object.entries(platforms)) {
            const url = extractUrl(body, data.pattern);
            if (url) {
                matchedPlatform = platform;
                matchedUrl = url;
                console.log(`[AUTO-DL] Detected ${platform} URL: ${url}`);
                break;
            }
        }
        
        // Skip if no platform matched
        if (!matchedPlatform || !matchedUrl) return;

        const caption = createCaption();
        
        // Show processing reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        try {
            // Handle download
            await handleApiDownload(client, from, matchedUrl, matchedPlatform, caption, message);
            await client.sendMessage(from, { react: { text: '✅', key: message.key } });
        } catch (apiError) {
            console.error(`[AUTO-DL] Error for ${matchedPlatform}:`, apiError.message);
            await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        }

    } catch (error) {
        console.error("[AUTO-DL] Main error:", error);
    }
});

// Handle API-based downloads
async function handleApiDownload(client, from, url, platformType, caption, message) {
    try {
        switch (platformType) {
            case "instagram":
                return await handleInstagram(client, from, url, caption, message);
            case "tiktok":
                return await handleTikTok(client, from, url, caption, message);
            case "youtube":
                return await handleYouTube(client, from, url, caption, message);
            case "facebook":
                return await handleFacebook(client, from, url, caption, message);
            case "pinterest":
                return await handlePinterest(client, from, url, caption, message);
            default:
                throw new Error("Unsupported platform");
        }
    } catch (error) {
        console.error(`[AUTO-DL] API error for ${platformType}:`, error.message);
        throw error;
    }
}

// Instagram handler with multiple API fallbacks
async function handleInstagram(client, from, url, caption, message) {
    let mediaItems = [];
    
    // Try first API
    try {
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        if (response.data?.status && response.data.data?.length) {
            mediaItems = response.data.data;
        }
    } catch (e) {
        console.log("[AUTO-DL] IG API 1 failed, trying backup...");
    }
    
    // Try backup API if first failed
    if (mediaItems.length === 0) {
        try {
            const backupApi = `https://jawad-tech.vercel.app/download/instagram?url=${encodeURIComponent(url)}`;
            const response = await axios.get(backupApi, { timeout: 30000 });
            
            if (response.data?.status && response.data.result) {
                const result = response.data.result;
                if (Array.isArray(result)) {
                    mediaItems = result.map(item => ({
                        url: item.url || item,
                        type: (item.url || item).includes('.mp4') ? 'video' : 'image'
                    }));
                } else if (typeof result === 'string') {
                    mediaItems = [{ url: result, type: result.includes('.mp4') ? 'video' : 'image' }];
                }
            }
        } catch (e) {
            console.log("[AUTO-DL] IG API 2 also failed");
        }
    }
    
    if (mediaItems.length === 0) {
        throw new Error("Failed to fetch Instagram media");
    }

    // Send all media items
    for (const item of mediaItems) {
        const mediaType = item.type === 'video' ? 'video' : 'image';
        const mediaUrl = item.url || item;
        
        await client.sendMessage(from, {
            [mediaType]: { url: mediaUrl },
            caption: caption,
            mimetype: mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
        }, { quoted: message });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

// TikTok handler with multiple API fallbacks
async function handleTikTok(client, from, url, caption, message) {
    let videoUrl = null;

    // API 1
    try {
        const api1 = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
        const res1 = await axios.get(api1, { timeout: 30000 });
        
        if (res1.data?.status && res1.data?.result) {
            videoUrl = res1.data.result;
        }
    } catch (e) {
        console.log("[AUTO-DL] TikTok API 1 failed");
    }
    
    // API 2
    if (!videoUrl) {
        try {
            const api2 = `https://jawad-tech.vercel.app/download/ttdl?url=${encodeURIComponent(url)}`;
            const res2 = await axios.get(api2, { timeout: 30000 });
            
            if (res2.data?.status && res2.data?.result) {
                videoUrl = res2.data.result;
            }
        } catch (e) {
            console.log("[AUTO-DL] TikTok API 2 failed");
        }
    }
    
    // API 3
    if (!videoUrl) {
        try {
            const api3 = `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
            const res3 = await axios.get(api3, { timeout: 30000 });
            
            if (res3.data?.status && res3.data?.result?.download) {
                videoUrl = res3.data.result.download;
            }
        } catch (e) {
            console.log("[AUTO-DL] TikTok API 3 failed");
        }
    }

    if (!videoUrl) {
        throw new Error("All TikTok APIs failed");
    }

    await client.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: caption
    }, { quoted: message });
}

// YouTube handler with fallback
async function handleYouTube(client, from, url, caption, message) {
    let videoUrl = null;
    let videoTitle = "";
    
    // Try main API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 60000 });
        
        if (response.data?.status && response.data.result?.mp4) {
            videoUrl = response.data.result.mp4;
            videoTitle = response.data.result.title || "";
        }
    } catch (e) {
        console.log("[AUTO-DL] YouTube API 1 failed");
    }
    
    // Try backup API
    if (!videoUrl) {
        try {
            const backupApi = `https://api.deline.web.id/downloader/youtube?url=${encodeURIComponent(url)}`;
            const response = await axios.get(backupApi, { timeout: 60000 });
            
            if (response.data?.status && response.data.result?.video) {
                videoUrl = response.data.result.video;
                videoTitle = response.data.result.title || "";
            }
        } catch (e) {
            console.log("[AUTO-DL] YouTube API 2 failed");
        }
    }

    if (!videoUrl) {
        throw new Error("Failed to fetch YouTube video");
    }
    
    const finalCaption = videoTitle ? `*${videoTitle}*\n\n${caption}` : caption;
    
    await client.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: finalCaption
    }, { quoted: message });
}

// Facebook handler with fallback
async function handleFacebook(client, from, url, caption, message) {
    let videoUrl = null;
    
    // Try main API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        if (response.data?.status && response.data.result?.length) {
            const video = response.data.result.find(v => v.quality === "HD") || 
                         response.data.result.find(v => v.quality === "SD") ||
                         response.data.result[0];
            if (video?.url) {
                videoUrl = video.url;
            }
        }
    } catch (e) {
        console.log("[AUTO-DL] Facebook API 1 failed");
    }
    
    // Try backup API
    if (!videoUrl) {
        try {
            const backupApi = `https://api.deline.web.id/downloader/facebook?url=${encodeURIComponent(url)}`;
            const response = await axios.get(backupApi, { timeout: 30000 });
            
            if (response.data?.status && response.data.result?.hd) {
                videoUrl = response.data.result.hd || response.data.result.sd;
            }
        } catch (e) {
            console.log("[AUTO-DL] Facebook API 2 failed");
        }
    }

    if (!videoUrl) {
        throw new Error("Failed to fetch Facebook video");
    }
    
    await client.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: caption
    }, { quoted: message });
}

// Pinterest handler with fallback
async function handlePinterest(client, from, url, caption, message) {
    let mediaUrl = null;
    let isVideo = false;
    
    // Try main API
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/pinterest?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        if (response.data?.status && response.data.result?.url) {
            mediaUrl = response.data.result.url;
            isVideo = response.data.result.type === 'video';
        }
    } catch (e) {
        console.log("[AUTO-DL] Pinterest API 1 failed");
    }
    
    // Try backup API
    if (!mediaUrl) {
        try {
            const backupApi = `https://api.deline.web.id/downloader/pinterest?url=${encodeURIComponent(url)}`;
            const response = await axios.get(backupApi, { timeout: 30000 });
            
            if (response.data?.status && response.data.result) {
                mediaUrl = response.data.result.url || response.data.result;
                isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video');
            }
        } catch (e) {
            console.log("[AUTO-DL] Pinterest API 2 failed");
        }
    }

    if (!mediaUrl) {
        throw new Error("Failed to fetch Pinterest media");
    }
    
    await client.sendMessage(from, {
        [isVideo ? 'video' : 'image']: { url: mediaUrl },
        mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
        caption: caption
    }, { quoted: message });
}

console.log("[AUTO-DL] Auto Downloader Plugin Loaded ✓");
