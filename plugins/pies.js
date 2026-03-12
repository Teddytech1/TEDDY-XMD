const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

const VALID_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab'];
const BASE_URL = 'https://shizoapi.onrender.com/api/pies';

cmd({
    pattern: "pies",
    alias: VALID_COUNTRIES,
    react: "🥧",
    desc: "Get pies images from different countries",
    category: "image",
    use: ".pies <country>",
    filename: __filename,
}, 
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
        let country = q?.toLowerCase();
        
        // If command is used directly as country name (alias)
        if (VALID_COUNTRIES.includes(command.toLowerCase())) {
            country = command.toLowerCase();
        }

        if (!country) {
            return reply(`🥧 *Pies Images*\n\nUsage: .pies <country>\n\nAvailable countries:\n${VALID_COUNTRIES.map(c => `• ${c}`).join('\n')}`);
        }

        if (!VALID_COUNTRIES.includes(country)) {
            return reply(`❌ Invalid country: ${country}\n\nAvailable: ${VALID_COUNTRIES.join(', ')}`);
        }

        await reply("⏳ Fetching pies image...");

        const apiUrl = `${BASE_URL}/${country}?apikey=shizo`;
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        // Check if response is image
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('image')) {
            throw new Error('API did not return an image');
        }

        await conn.sendMessage(from, {
            image: response.data,
            caption: `🥧 Pies: ${country.charAt(0).toUpperCase() + country.slice(1)}`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421104812135@newsletter',
                    newsletterName: "Pies Collection",
                    serverMessageId: 143,
                },
            },
        }, { quoted: m });

    } catch (error) {
        console.error('Pies Command Error:', error);
        
        let errorMessage = '❌ Failed to fetch pies image. Please try again.';
        
        if (error.response?.status === 404) {
            errorMessage = '❌ Image not found for this country.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = '❌ API service unavailable. Try again later.';
        } else if (error.message.includes('image')) {
            errorMessage = '❌ Invalid image response from API.';
        }
        
        reply(errorMessage);
    }
});
