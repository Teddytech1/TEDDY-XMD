const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "roseday",
    alias: ["rose", "rosedayquote"],
    react: "🌹",
    desc: "Get beautiful Rose Day quotes and messages",
    category: "fun",
    use: ".roseday",
    filename: __filename,
}, 
async (conn, mek, m, {
    from, l, quoted, body, isCmd, command, args, q, isGroup, sender, 
    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
    groupMetadata, groupName, participants, isItzcp, groupAdmins, 
    isBotAdmins, isAdmins, reply 
}) => {
    try {
        const response = await axios.get(`https://api.princetechn.com/api/fun/roseday?apikey=prince`);
        
        if (response.data && response.data.result) {
            const rosedayMessage = response.data.result;
            
            // Send the roseday message with your style
            await conn.sendMessage(from, {
                text: rosedayMessage,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421104812135@newsletter',
                        newsletterName: "Rose Day Quotes",
                        serverMessageId: 143,
                    },
                },
            }, { quoted: m });
        } else {
            throw new Error('Invalid API response');
        }
        
    } catch (error) {
        console.error('❌ Error in roseday command:', error);
        
        let errorMessage = '❌ Failed to get Rose Day quote. Please try again later!';
        
        if (error.response?.status === 404) {
            errorMessage = '❌ Rose Day service is currently unavailable.';
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorMessage = '❌ Network error. Please check your connection.';
        } else if (error.response?.status === 429) {
            errorMessage = '❌ Rate limit exceeded. Please try again later.';
        }
        
        await reply(errorMessage);
    }
});
