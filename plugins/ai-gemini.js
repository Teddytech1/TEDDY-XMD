const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "gemini",
    alias: ["gm", "google"],
    react: "🤖",
    desc: "Interact with Gemini AI",
    category: "ai",
    use: ".gemini <prompt>",
    filename: __filename
}, async (conn, mek, m, { from, q, quoted, reply }) => {
    try {
        if (!q) {
            return reply("Please provide a prompt to interact with Gemini AI.");
        }

        // Get Gemini API from external source
        const apis = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
        const geminiApi = apis.data.gemini;

        let promptData = {
            modelType: 'text_only',
            prompt: q
        };

        // Check if there's an image in quoted message
        if (quoted && quoted.imageMessage) {
            // Download image and convert to base64
            const imageBuffer = await quoted.download();
            const base64Image = imageBuffer.toString('base64');
            
            promptData = {
                modelType: 'text_and_image',
                prompt: q,
                imageParts: [`data:image/jpeg;base64,${base64Image}`]
            };
        }

        const { data } = await axios.post(geminiApi + '/gemini', promptData, {
            timeout: 30000
        });

        const result = data?.result;

        if (result) {
            await conn.sendMessage(from, {
                text: `🤖 *Gemini AI*\n\n${result}\n\n*TEDDY-XMD*`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421104812135@newsletter',
                        newsletterName: "TEDDY-XMD",
                        serverMessageId: 143,
                    },
                },
            }, { quoted: m });
        } else {
            reply("❌ No response received from Gemini AI. Please try again.");
        }

    } catch (error) {
        console.error('Gemini AI Error:', error);
        
        if (error.code === 'ECONNREFUSED') {
            reply("❌ Gemini service is currently unavailable.");
        } else if (error.code === 'TIMEOUT') {
            reply("❌ Request timeout. Please try again.");
        } else if (error.response?.status === 404) {
            reply("❌ Gemini API endpoint not found.");
        } else {
            reply("❌ An error occurred while interacting with Gemini AI.");
        }
    }
});
