const path = require('path');
const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 =
                       `*VERSION:* ${settings.version}\n` +
                       `*STATUS:* Online\n` +
                       `*MODE:* Public\n\n` +
                       `TYPE *.menu* for full commands\n\n🌙Teddy Xmd is alive🏂`;

        await sock.sendMessage(chatId, {
            text: message1,
            //image: { url: "https://files.catbox.moe/6tli51.jpg" },
           // hasMediaAttachment: true,
            contextInfo: {
                forwardingScore: 99,
                remoteJid: "status@broadcast",
                isForwarded: false, 
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '',
                    newsletterName: ' MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
        
        //send audio
     sock.sendMessage(chatId, {
                        audio: { url: "https://files.catbox.moe/qpnk2b.mp3" },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, {
                        quoted: message
                    });
                    
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'Bot is alive and running!' }, { quoted: message });
    }
}

module.exports = aliveCommand;

