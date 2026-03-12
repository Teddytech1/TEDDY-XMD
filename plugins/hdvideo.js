
const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "hdvideo",
    alias: ["enhancevideo", "hdvid", "upscale", "hd"],
    react: "🎬",
    desc: "Enhance video quality to HD. Reply to a video or provide a video URL.",
    category: "media",
    use: ".hdvideo (reply to video)",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, reply }) => {
    try {
        const videoUrl = args.join(' ').trim();
        let apiRequestUrl;
        let processingMsg;

        // ========== FEATURE 2: URL PROVIDED ==========
        if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
            
            processingMsg = await conn.sendMessage(from, { 
                text: "⏳ *Processing video from URL...*\n\n📤 Sending to HD Enhancer...\n⏱️ Please wait, this may take a while!" 
            }, { quoted: mek });
            
            apiRequestUrl = `https://api-faa.my.id/faa/hdvid?url=${encodeURIComponent(videoUrl)}`;
        }
        
        // ========== FEATURE 1: REPLY TO VIDEO (IMPORTANT) ==========
        else if (quoted && quoted.videoMessage) {
            
            processingMsg = await conn.sendMessage(from, { 
                text: "⏳ *Enhancing your video to HD...*\n\n📥 Step 1: Downloading video...\n📤 Step 2: Uploading for processing...\n🎬 Step 3: Enhancing to HD...\n\n⏱️ Please wait!" 
            }, { quoted: mek });

            // Step 1: Download the quoted video from WhatsApp using downloadContentFromMessage
            let videoBuffer;
            try {
                const stream = await downloadContentFromMessage(
                    quoted.videoMessage,
                    'video'
                );

                videoBuffer = Buffer.from([]);
                for await (const chunk of stream) {
                    videoBuffer = Buffer.concat([videoBuffer, chunk]);
                }
            } catch (downloadErr) {
                console.error("Video download error:", downloadErr);
                return reply("❌ Failed to download the video. Please try again.");
            }

            if (!videoBuffer || videoBuffer.length === 0) {
                return reply("❌ Could not download the video. The video might be unavailable.");
            }

            console.log(`Video downloaded successfully. Size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

            // Step 2: Upload video to temporary file hosting service
            let tempVideoUrl;
            
            try {
                // Method 1: Try tmpfiles.org
                const form = new FormData();
                form.append('file', videoBuffer, { 
                    filename: 'video.mp4', 
                    contentType: 'video/mp4' 
                });

                const uploadResponse = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                    headers: {
                        ...form.getHeaders()
                    },
                    timeout: 120000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });

                if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.url) {
                    // Convert to direct download URL
                    tempVideoUrl = uploadResponse.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
                    console.log("Uploaded to tmpfiles.org:", tempVideoUrl);
                }
            } catch (uploadErr1) {
                console.error("tmpfiles.org upload failed:", uploadErr1.message);
                
                // Method 2: Try catbox.moe as backup
                try {
                    const form2 = new FormData();
                    form2.append('reqtype', 'fileupload');
                    form2.append('fileToUpload', videoBuffer, { 
                        filename: 'video.mp4', 
                        contentType: 'video/mp4' 
                    });

                    const uploadResponse2 = await axios.post('https://catbox.moe/user/api.php', form2, {
                        headers: {
                            ...form2.getHeaders()
                        },
                        timeout: 120000,
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    });

                    if (uploadResponse2.data && typeof uploadResponse2.data === 'string' && uploadResponse2.data.startsWith('http')) {
                        tempVideoUrl = uploadResponse2.data;
                        console.log("Uploaded to catbox.moe:", tempVideoUrl);
                    }
                } catch (uploadErr2) {
                    console.error("catbox.moe upload failed:", uploadErr2.message);
                    
                    // Method 3: Try file.io as last backup
                    try {
                        const form3 = new FormData();
                        form3.append('file', videoBuffer, { 
                            filename: 'video.mp4', 
                            contentType: 'video/mp4' 
                        });

                        const uploadResponse3 = await axios.post('https://file.io', form3, {
                            headers: {
                                ...form3.getHeaders()
                            },
                            timeout: 120000
                        });

                        if (uploadResponse3.data && uploadResponse3.data.success && uploadResponse3.data.link) {
                            tempVideoUrl = uploadResponse3.data.link;
                            console.log("Uploaded to file.io:", tempVideoUrl);
                        }
                    } catch (uploadErr3) {
                        console.error("file.io upload failed:", uploadErr3.message);
                    }
                }
            }

            if (!tempVideoUrl) {
                return reply("❌ Failed to upload video for processing. Please try again or use a video URL instead.");
            }

            apiRequestUrl = `https://api-faa.my.id/faa/hdvid?url=${encodeURIComponent(tempVideoUrl)}`;
        }
        
        // ========== NO VIDEO PROVIDED ==========
        else {
            return reply(`❌ *No video detected!*\n\n📋 *How to use:*\n\n*Method 1:* Reply to a video with:\n\`.hdvideo\`\n\n*Method 2:* Send a video URL:\n\`.hdvideo https://example.com/video.mp4\`\n\n_This command will enhance your video to HD quality!_`);
        }

        // ========== CALL HD ENHANCEMENT API ==========
        let apiResponse;
        try {
            console.log("Calling HD API:", apiRequestUrl);
            apiResponse = await axios.get(apiRequestUrl, { 
                timeout: 180000 // 3 minutes timeout for processing
            });
        } catch (apiErr) {
            console.error("HD API Error:", apiErr.message);
            if (apiErr.code === 'ECONNABORTED') {
                return reply("❌ Request timed out. The video might be too large. Try a shorter video.");
            }
            return reply("❌ HD Enhancement API is currently unavailable. Please try again later.");
        }

        // ========== VALIDATE API RESPONSE ==========
        if (!apiResponse.data || !apiResponse.data.status) {
            console.error("API Response Error:", apiResponse.data);
            return reply("❌ Failed to enhance video. The API returned an error.");
        }

        if (!apiResponse.data.result || !apiResponse.data.result.download_url) {
            return reply("❌ Failed to get enhanced video URL from the API.");
        }

        const hdVideoUrl = apiResponse.data.result.download_url;
        const quality = apiResponse.data.result.quality || "HD";
        const format = apiResponse.data.result.format || "mp4";

        console.log("HD Video URL:", hdVideoUrl);

        // ========== DOWNLOAD ENHANCED HD VIDEO ==========
        let hdVideoBuffer;
        try {
            const hdVideoResponse = await axios.get(hdVideoUrl, { 
                responseType: 'arraybuffer',
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            hdVideoBuffer = Buffer.from(hdVideoResponse.data);
        } catch (downloadErr) {
            console.error("HD Video Download Error:", downloadErr.message);
            // If download fails, send the URL instead
            return reply(`✅ *Video Enhanced Successfully!*\n\n📹 Quality: ${quality}\n🎬 Format: ${format}\n\n🔗 *Download Link:*\n${hdVideoUrl}\n\n_Could not send directly. Please download from link._`);
        }

        if (!hdVideoBuffer || hdVideoBuffer.length === 0) {
            return reply(`✅ *Video Enhanced Successfully!*\n\n📹 Quality: ${quality}\n🎬 Format: ${format}\n\n🔗 *Download Link:*\n${hdVideoUrl}`);
        }

        // ========== SEND ENHANCED VIDEO ==========
        try {
            await conn.sendMessage(from, {
                video: hdVideoBuffer,
                caption: `✅ *Video Enhanced to HD Successfully!*\n\n📹 *Quality:* ${quality}\n🎬 *Format:* ${format.toUpperCase()}\n📦 *Size:* ${(hdVideoBuffer.length / (1024 * 1024)).toFixed(2)} MB\n\n_🎥 Powered by DARK-ERFAN_`,
                mimetype: 'video/mp4'
            }, { quoted: mek });

            // Delete the processing message
            try {
                await conn.sendMessage(from, { delete: processingMsg.key });
            } catch (e) {}

        } catch (sendErr) {
            console.error("Video Send Error:", sendErr.message);
            // If sending fails (maybe file too large), send URL
            reply(`✅ *Video Enhanced Successfully!*\n\n📹 Quality: ${quality}\n🎬 Format: ${format}\n\n🔗 *Download Link:*\n${hdVideoUrl}\n\n_Video was too large to send directly._`);
        }

    } catch (e) {
        console.error("HD Video Enhancement Error:", e);
        reply("❌ An unexpected error occurred. Please try again later.");
    }
});
