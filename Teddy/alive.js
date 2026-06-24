const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const startTime = process.uptime();
        const hours = Math.floor(startTime / 3600);
        const minutes = Math.floor((startTime % 3600) / 60);
        const seconds = Math.floor(startTime % 60);

        const caption = `
╭━━━〔 🤖 *TEDDY-XMD* 〕━━━⬣
┃
┃ ✦ *Status:* 🟢 Online
┃ ✦ *Version:* ${settings.version || '1.0.0'}
┃ ✦ *Mode:* ${settings.MODE || 'Public'}
┃ ✦ *Prefix:* ${settings.PREFIX || '.'}
┃ ✦ *Uptime:* ${hours}h ${minutes}m ${seconds}s
┃
┣━━━〔 ✨ FEATURES 〕━━━⬣
┃ ❍ Group Management
┃ ❍ AI Commands
┃ ❍ Downloaders
┃ ❍ Anti Delete
┃ ❍ Auto Status View
┃ ❍ Fun & Games
┃ ❍ Stickers & Media
┃ ❍ And Much More...
┃
┣━━━〔 📌 INFO 〕━━━⬣
┃ Type *${settings.PREFIX || '.'}menu*
┃ to see all commands.
┃
╰━━━━━━━━━━━━━━━━━━⬣

> *TEDDY-XMD • Always Online 🚀*
`;

        await sock.sendMessage(
            chatId,
            {
                image: {
                    url: 'https://files.catbox.moe/5ffdce.jpeg'
                },
                caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421104812135@newsletter',
                        newsletterName: 'TEDDY-XMD',
                        serverMessageId: -1
                    }
                }
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error in alive command:', error);

        await sock.sendMessage(
            chatId,
            {
                text: '🟢 *TEDDY-XMD is Online and Running!*'
            },
            { quoted: message }
        );
    }
}

module.exports = aliveCommand;