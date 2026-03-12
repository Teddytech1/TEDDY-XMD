
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');
const FormData = require('form-data');

cmd({
    pattern: "dewatermark",
    alias: ["watermark", "wr"],
    react: "🧼",
    desc: "Remove watermark from image",
    category: "image",
    use: ".dewatermark (reply to image)",
    filename: __filename,
},
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        if (!quoted || !quoted.imageMessage) {
            return reply("🖼️ Please reply to an image with `.dewatermark`");
        }

        await reply("🧼 Removing watermark, please wait...");

        // Download image from WhatsApp
        const stream = await downloadContentFromMessage(
            quoted.imageMessage,
            'image'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Upload to temp hosting
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const upload = await axios.post(
            'https://tmpfiles.org/api/v1/upload',
            form,
            { headers: form.getHeaders() }
        );

        const imageUrl = upload.data.data.url.replace(
            'tmpfiles.org/',
            'tmpfiles.org/dl/'
        );

        // Call dewatermark API (IMAGE RESPONSE)
        const apiUrl =
            `https://api.elrayyxml.web.id/api/tools/dewatermark?url=${encodeURIComponent(imageUrl)}`;

        const result = await axios.get(apiUrl, {
            responseType: "arraybuffer",
            timeout: 60000
        });

        // Send processed image back
        await conn.sendMessage(
            from,
            {
                image: Buffer.from(result.data),
                caption: "> ✅ Watermark removed successfully"
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("DEWATERMARK ERROR:", err);
        reply("❌ Failed to remove watermark. Please try again.");
    }
});
          
