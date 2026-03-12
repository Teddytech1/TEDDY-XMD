

const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');
const FormData = require('form-data');

cmd({
    pattern: "remini",
    alias: ["enhance"],
    react: "🪄",
    desc: "Enhance image quality using Remini AI",
    category: "image",
    use: ".hdimg (reply to image)",
    filename: __filename,
},
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        // Must reply to image
        if (!quoted || !quoted.imageMessage) {
            return reply("🖼️ Please reply to an image with `.hdimg`");
        }

        await reply("⏳ Processing image, please wait...");

        // Download image from WhatsApp
        const stream = await downloadContentFromMessage(
            quoted.imageMessage,
            'image'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Upload image to temporary hosting
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'remini.jpg',
            contentType: 'image/jpeg'
        });

        const uploadRes = await axios.post(
            'https://tmpfiles.org/api/v1/upload',
            form,
            { headers: form.getHeaders() }
        );

        const imageUrl = uploadRes.data.data.url.replace(
            'tmpfiles.org/',
            'tmpfiles.org/dl/'
        );

        // Call NEW Remini API
        const apiUrl =
            `https://anabot.my.id/api/ai/remini?imageUrl=${encodeURIComponent(imageUrl)}&apikey=freeApikey`;

        const apiRes = await axios.get(apiUrl, { timeout: 60000 });
        const apiData = apiRes.data;

        // Validate API response
        if (!apiData.success || !apiData.data?.result) {
            return reply("❌ Enhancement failed. API returned no image.");
        }

        // Send enhanced image
        await conn.sendMessage(
            from,
            {
                image: { url: apiData.data.result },
                caption: "> ✨ Image Enhanced Successfully by TEDDY-XMD"
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("HDIMG ERROR:", err);
        reply("❌ Image enhancement failed. Please try again.");
    }
});
