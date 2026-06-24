const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
╭━━━〔 🤖 ${settings.botName || 'TEDDY-XMD'} 〕━━━⬣
┃ 👑 Owner : ${settings.botOwner || 'TEDDY'}
┃ ⚡ Version : ${settings.version || '3.0.0'}
┃ 🚀 Prefix : .
╰━━━━━━━━━━━━━━━━━━⬣

> *WELCOME TO TEDDY-XMD COMMAND PANEL*

╭─❒ 「 🌐 GENERAL 」
│➤ .menu / .help
│➤ .ping
│➤ .alive
│➤ .tts <text>
│➤ .owner
│➤ .joke
│➤ .quote
│➤ .fact
│➤ .weather <city>
│➤ .news
│➤ .attp <text>
│➤ .lyrics <song>
│➤ .8ball <question>
│➤ .groupinfo
│➤ .admins
│➤ .vv
│➤ .trt <text>
│➤ .ss <link>
│➤ .jid
│➤ .url
╰────────────⬣

╭─❒ 「 👮 ADMIN 」
│➤ .ban @user
│➤ .promote @user
│➤ .demote @user
│➤ .mute
│➤ .unmute
│➤ .delete
│➤ .kick @user
│➤ .warn @user
│➤ .warnings
│➤ .antilink
│➤ .antibadword
│➤ .clear
│➤ .tagall
│➤ .hidetag
│➤ .chatbot
│➤ .welcome
│➤ .goodbye
│➤ .setgdesc
│➤ .setgname
│➤ .setgpp
╰────────────⬣

╭─❒ 「 🔒 OWNER 」
│➤ .mode
│➤ .clearsession
│➤ .antidelete
│➤ .cleartmp
│➤ .update
│➤ .settings
│➤ .setpp
│➤ .autoreact
│➤ .autostatus
│➤ .autotyping
│➤ .autoread
│➤ .anticall
│➤ .pmblocker
│➤ .mention
╰────────────⬣

╭─❒ 「 🎨 STICKERS 」
│➤ .sticker
│➤ .crop
│➤ .simage
│➤ .blur
│➤ .removebg
│➤ .remini
│➤ .tgsticker
│➤ .take
│➤ .emojimix
╰────────────⬣

╭─❒ 「 🤖 AI 」
│➤ .gpt
│➤ .gemini
│➤ .imagine
│➤ .flux
│➤ .sora
╰────────────⬣

╭─❒ 「 📥 DOWNLOADERS 」
│➤ .play
│➤ .song
│➤ .spotify
│➤ .instagram
│➤ .facebook
│➤ .tiktok
│➤ .video
│➤ .ytmp4
╰────────────⬣

╭─❒ 「 🎯 FUN 」
│➤ .compliment
│➤ .insult
│➤ .flirt
│➤ .character
│➤ .ship
│➤ .simp
│➤ .stupid
╰────────────⬣

╭─❒ 「 💻 GITHUB 」
│➤ .git
│➤ .github
│➤ .repo
│➤ .script
│➤ .sc
╰────────────⬣

╭━━━━━━━━━━━━━━━━━━⬣
┃ 🌟 Thanks For Using
┃ 🤖 TEDDY-XMD
┃ 📢 Channel : TEDDY-XMD
╰━━━━━━━━━━━━━━━━━━⬣
`.trim();

    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363421104812135@newsletter',
            newsletterName: 'TEDDY-XMD',
            serverMessageId: -1
        }
    };

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage,
                contextInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Help command error:', error);
        await sock.sendMessage(chatId, {
            text: helpMessage,
            contextInfo
        }, { quoted: message });
    }
}

module.exports = helpCommand;