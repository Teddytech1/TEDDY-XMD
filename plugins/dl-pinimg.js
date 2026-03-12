const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pinterestimg",
    alias: ["pinimg", "pinimg", "pinterestdlimg", "pindlimg"],
    react: "📌",
    desc: "Download images from Pinterest by search query",
    category: "download",
    use: ".pinterest <search query>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        // Check if query is provided
        const query = args.join(' ').trim();
        
        if (!query) {
            return reply(`📌 *Pinterest Image Downloader*\n\n❌ Please provide a search query!\n\n*Usage:*\n• \`.pinterest anime girl\`\n• \`.pinterest cats\`\n• \`.pin wallpaper\`\n\n_Powered by DARKZONE-MD_`);
        }

        // Send processing message
        await reply(`📌 *Pinterest Search*\n\n🔍 Searching: *${query}*\n⏳ Please wait...`);

        // Try different parameter names
        let apiResponse;
        let success = false;
        
        const paramNames = ['query', 'q', 'search', 'text'];
        
        for (const param of paramNames) {
            if (success) break;
            
            try {
                const url = `https://api-faa.my.id/faa/pinterest?${param}=${encodeURIComponent(query)}`;
                console.log(`[Pinterest] Trying: ${url}`);
                
                apiResponse = await axios({
                    method: 'GET',
                    url: url,
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    }
                });
                
                if (apiResponse.data && apiResponse.data.status === true && apiResponse.data.result) {
                    success = true;
                    console.log(`[Pinterest] Success with param: ${param}`);
                }
            } catch (err) {
                console.log(`[Pinterest] Failed with ${param}: ${err.message}`);
                continue;
            }
        }

        // If all params failed, try without any specific param handling
        if (!success) {
            try {
                apiResponse = await axios.get(`https://api-faa.my.id/faa/pinterest`, {
                    params: { query: query },
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (apiResponse.data && apiResponse.data.result) {
                    success = true;
                }
            } catch (err) {
                console.log(`[Pinterest] Final attempt failed: ${err.message}`);
            }
        }

        // Check if we got results
        if (!success || !apiResponse || !apiResponse.data) {
            return reply("❌ Failed to connect to Pinterest API. Please try again.");
        }

        const data = apiResponse.data;
        
        // Handle different response formats
        let images = [];
        
        if (Array.isArray(data.result)) {
            images = data.result;
        } else if (Array.isArray(data)) {
            images = data;
        } else if (typeof data.result === 'string') {
            images = [data.result];
        }

        if (images.length === 0) {
            return reply(`❌ No images found for "*${query}*". Try a different search.`);
        }

        // Send images (max 5)
        const maxImages = Math.min(images.length, 5);
        let sentCount = 0;

        for (let i = 0; i < maxImages; i++) {
            try {
                const imageUrl = images[i];
                
                // Validate URL
                if (!imageUrl || !imageUrl.startsWith('http')) {
                    continue;
                }

                // Download image
                const imageBuffer = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }).then(res => Buffer.from(res.data));

                // Send image
                await conn.sendMessage(from, {
                    image: imageBuffer,
                    caption: `📌 *Pinterest Image [${i + 1}/${maxImages}]*\n\n🔍 *Search:* ${query}\n\n━━━━━━━━━━━━━━━━━━━━━\n*📥 Downloaded by TEDDY-XMD*\n━━━━━━━━━━━━━━━━━━━━━`
                }, { quoted: mek });

                sentCount++;
                
                // Delay
                await new Promise(r => setTimeout(r, 1000));

            } catch (imgErr) {
                console.error(`[Pinterest] Image ${i + 1} failed:`, imgErr.message);
                continue;
            }
        }

        if (sentCount === 0) {
            return reply("❌ Failed to download images. Please try again.");
        }

        // Success message
        await reply(`✅ *Download Complete!*\n\n📷 Sent: ${sentCount} images\n🔍 Query: ${query}\n\n*🌟 DARKZONE-MD*`);

    } catch (e) {
        console.error("[Pinterest] Error:", e);
        reply("❌ An error occurred. Please try again.");
    }
});

// ========== SINGLE PINTEREST IMAGE ==========
