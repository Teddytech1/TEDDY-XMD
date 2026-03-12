const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');
const os = require('os');

cmd({
    pattern: "menu3",
    desc: "Show interactive menu system",
    category: "menu3",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Get real-time data
        const totalCommands = Object.keys(commands).length;
        const uptime = runtime(process.uptime());
        const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const platform = os.platform();
        const currentTime = new Date().toLocaleTimeString();
        const currentDate = new Date().toLocaleDateString();
        
        const botName = config.BOT_NAME || "TEDDY-XMD";
        const ownerName = config.OWNER_NAME || "DEVELOPER";
        const prefix = config.PREFIX || ".";
        const mode = config.MODE || "public";

        const menuCaption = `╔══════════════════╗
║  ${botName}
║  ᴜʟᴛɪᴍᴀᴛᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ
╚══════════════════╝

╔════❰ 🤖 ʙᴏᴛ ɪɴғᴏ ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 📛 ʙᴏᴛ: ${botName}
║ 🔣 ᴘʀᴇғɪx: [ ${prefix} ]
║ 📳 ᴍᴏᴅᴇ: ${mode}
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
║ 📚 ᴄᴍᴅs: ${totalCommands}
╚══════════════════╝

╔═════❰ 💻 sʏsᴛᴇᴍ ❱════╗
║ 🧠 ʀᴀᴍ: ${ramUsed}ᴍʙ / ${totalRam}ɢʙ
║ 🖥️ ᴘʟᴀᴛғᴏʀᴍ: ${platform}
║ 📅 ᴅᴀᴛᴇ: ${currentDate}
║ 🕐 ᴛɪᴍᴇ: ${currentTime}
╚══════════════════╝

╔══❰ 📜 ᴍᴇɴᴜ sᴇᴄᴛɪᴏɴs ❱══╗
║
║ 1️⃣  📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ
║ 2️⃣  👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ
║ 3️⃣  😄 ғᴜɴ ᴍᴇɴᴜ
║ 4️⃣  👑 ᴏᴡɴᴇʀ ᴍᴇᴜ
║ 5️⃣  🤖 ᴀɪ ᴍᴇɴᴜ
║ 6️⃣  🎎 ᴀɴɪᴍᴇ ᴍᴇɴᴜ
║ 7️⃣  🔄 ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ
║ 8️⃣  📌 ᴏᴛʜᴇʀ ᴍᴇɴᴜ
║ 9️⃣  💞 ʀᴇᴀᴄᴛɪᴏɴs ᴍᴇɴᴜ
║ 🔟  🏠 ᴍᴀɪɴ ᴍᴇɴᴜ
║
╚══════════════════╝
> ʀᴇᴘʟʏ ᴡɪᴛʜ ɴᴜᴍʙᴇʀ (1-10) ғᴏʀ ᴅᴇᴛᴀɪʟs
> ${config.DESCRIPTION || '🌟 POWERED BY TEDDY TECH HUB'}`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363421104812135@newsletter',
                newsletterName: 'TEDDY-XMD',
                serverMessageId: 143
            }
        };

        // Send menu with image
        let sentMsg;
        try {
            sentMsg = await conn.sendMessage(from, {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/13nyhx.jpg' },
                caption: menuCaption,
                contextInfo: contextInfo
            }, { quoted: mek });
        } catch (e) {
            sentMsg = await conn.sendMessage(from, {
                text: menuCaption,
                contextInfo: contextInfo
            }, { quoted: mek });
        }
        
        const messageID = sentMsg.key.id;

        // Menu data with double sidebar
        const menuData = {
            '1': {
                title: "📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ
╚══════════════════╝

╔═════❰ 📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 📥 ᴄᴏᴍᴍᴀɴᴅs: 44
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔═══❰  🌐 sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ ❱══╗
║ ─ ғᴀᴄᴇʙᴏᴏᴋ [ᴜʀʟ]
║ ─ ᴅᴏᴡɴʟᴏᴀᴅ [ᴜʀʟ]
║ ─ ᴍᴇᴅɪᴀғɪʀᴇ [ᴜʀʟ]
║ ─ ᴛɪᴋᴛᴏᴋ [ᴜʀʟ]
║ ─ ᴛᴡɪᴛᴛᴇʀ [ᴜʀʟ]
║ ─ ɪɴsᴛᴀ [ᴜʀʟ]
║ ─ ᴀᴘᴋ [ᴀᴘᴘ]
║ ─ ɪᴍɢ [ǫᴜᴇʀʏ]
║ ─ ᴘɪɴs [ᴜʀʟ]
║ ─ ᴘɪɴᴛᴇʀᴇsᴛ [ᴜʀʟ]
║ ─ sᴘᴏᴛɪғʏᴘʟᴀʏ
║ ─ sᴘʟᴀʏ
╚══════════════════╝

╔═══❰ 🎵 ᴍᴜsɪᴄ/ᴠɪᴅᴇᴏ ❱═══╗
║ ─ sᴘᴏᴛɪғʏ [ǫᴜᴇʀʏ]
║ ─ ᴘʟᴀʏ [sᴏɴɢ]
║ ─ ᴘʟᴀʏ2-10 [sᴏɴɢ]
║ ─ ᴀᴜᴅɪᴏ [ᴜʀʟ]
║ ─ ᴠɪᴅᴇᴏ [ᴜʀʟ]
║ ─ ᴠɪᴅᴇᴏ2-10 [ᴜʀʟ]
║ ─ ʏᴛᴍᴘ3 [ᴜʀʟ]
║ ─ ʏᴛᴍᴘ4 [ᴜʀʟ]
║ ─ sᴏɴɢ [ɴᴀᴍᴇ]
║ ─ ᴅᴀʀᴀᴍᴀ [ɴᴀᴍᴇ]
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '2': {
                title: "👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ",
                content: `╔════════════════════╗
║  ${botName}
║  👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ
╚══════════════════╝
╔════❰ 📊  sᴛᴀᴛᴜs ❱═════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 👥 ᴄᴏᴍᴍᴀɴᴅs: 37
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔══❰ 🔧 ᴍᴀɴᴀɢᴇᴍᴇɴᴛ ❱════╗
║ ─ ɢʀᴏᴜᴘʟɪɴᴋ
║ ─ ᴋɪᴄᴋᴀʟʟ
║ ─ ᴋɪᴄᴋᴀʟʟ2
║ ─ ᴋɪᴄᴋᴀʟʟ3
║ ─ ᴀᴅᴅ @ᴜsᴇʀ
║ ─ ʀᴇᴍᴏᴠᴇ @ᴜsᴇʀ
║ ─ ᴋɪᴄᴋ @ᴜsᴇʀ
╚══════════════════╝

╔══❰ ⚡ ᴀᴅᴍɪɴ ᴛᴏᴏʟs ❱════╗
║ ─ ᴘʀᴏᴍᴏᴛᴇ @ᴜsᴇʀ
║ ─ ᴅᴇᴍᴏᴛᴇ @ᴜsᴇʀ
║ ─ ᴅɪsᴍɪss
║ ─ ʀᴇᴠᴏᴋᴇ
║ ─ ᴍᴜᴛᴇ [ᴛɪᴍᴇ]
║ ─ ᴜɴᴍᴜᴛᴇ
║ ─ ʟᴏᴄᴋɢᴄ
║ ─ ᴜɴʟᴏᴄᴋɢᴄ
║ ─ ɢʀᴏᴜᴘᴅᴘ
║ ─ ʷᵉˡᶜᵒᵐᵉⁱᵐᵍ
║ ─ ᵃᵘᵗᵒᵃᵖᵖʳᵒᵛᵉ
╚══════════════════╝

╔════❰ 🏷️ ᴛᴀɢɢɪɴɢ ❱═════╗
║ ─ ᴛᴀɢ @ᴜsᴇʀ
║ ─ ʜɪᴅᴇᴛᴀɢ [ᴍsɢ]
║ ─ ᴛᴀɢᴀʟʟ
║ ─ ᴛᴀɢᴀᴅᴍɪɴs
║ ─ ɪɴᴠɪᴛᴇ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '3': {
                title: "😄 ғᴜɴ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  😄 ғᴜɴ ᴍᴇɴᴜ
╚══════════════════╝

╔═════❰  📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🎮 ᴄᴏᴍᴍᴀɴᴅs: 24
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔════❰ 🎭 ɪɴᴛᴇʀᴀᴄᴛɪᴠᴇ ❱═══╗
║ ─ sʜᴀᴘᴀʀ
║ ─ ʀᴀᴛᴇ @ᴜsᴇʀ
║ ─ ɪɴsᴜʟᴛ @ᴜsᴇʀ
║ ─ ʜᴀᴄᴋ @ᴜsᴇʀ
║ ─ sʜɪᴘ @ᴜsᴇʀ1 @ᴜsᴇʀ2
║ ─ ᴄʜᴀʀᴀᴄᴛᴇʀ
║ ─ ᴘɪᴄᴋᴜᴘ
║ ─ ᴊᴏᴋᴇ
║ ─ ʸᵗᶜᵒᵐᵐᵉⁿᵗ
╚══════════════════╝

╔════❰ 😊 ᴇᴍᴏᴛɪᴏɴs ❱════╗
║ ─ ʟᴏᴠᴇ
║ ─ ʜᴀᴘᴘʏ
║ ─ sᴀᴅ
║ ─ ʜᴏᴛ
║ ─ sʜʏ
║ ─ ᴋɪss
║ ─ ʙʀᴏᴋᴇ
║ ─ ʜᴜʀᴛ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '4': {
                title: "👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
╚══════════════════╝

╔════❰   📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🛠️ ᴄᴏᴍᴍᴀɴᴅs: 30
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔═════❰ 💗 ᴜsᴇʀ ᴛᴏᴏʟs ❱══╗
║ ─ ʙʟᴏᴄᴋ
║ ─ ᴜɴʙʟᴏᴄᴋ
║ ─ ғᴜʟʟᴘᴘ
║ ─ sᴇᴛᴘᴘ
║ ─ ʀᴇsᴛᴀʀᴛ
║ ─ sʜᴜᴛᴅᴏᴡɴ
║ ─ ᴜᴘᴅᴀᴛᴇᴄᴍᴅ
╚══════════════════╝

╔═════❰ ⚠️ ɪɴғᴏ ᴛᴏᴏʟs ❱══╗
║ ─ ɢᴊɪᴅ
║ ─ ᴊɪᴅ
║ ─ ʟɪsᴛᴄᴍᴅ
║ ─ ᴀʟʟᴍᴇɴᴜ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '5': {
                title: "🤖 ᴀɪ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  🤖 ᴀɪ ᴍᴇɴᴜ
╚══════════════════╝

╔══════❰ 📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🤖 ᴄᴏᴍᴍᴀɴᴅs: 17
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔════❰  💬 ᴄʜᴀᴛ ᴀɪ ❱═════╗
║ ─ ᴀɪ
║ ─ ɢᴘᴛ
║ ─ ɢᴘᴛ2
║ ─ ɢᴘᴛ3
║ ─ ɢᴘᴛᴍɪɴɪ
║ ─ ᴍᴇᴛᴀ
║ ─ ʙᴀʀᴅ
║ ─ ғᴇʟᴏ
║ ─ ɢɪᴛᴀ
╚══════════════════╝

╔═════❰  🖼️ ɪᴍᴀɢᴇ ᴀɪ ❱═══╗
║ ─ ɪᴍᴀɢɪɴᴇ [ᴛᴇxᴛ]
║ ─ ɪᴍᴀɢɪɴᴇ2 [ᴛᴇxᴛ]
║ ─ ᴀɪᴀʀᴛ
║ ─ ʙʟᴀᴄᴋʙᴏx [ǫᴜᴇʀʏ]
║ ─ ʟᴜᴍᴀ [ǫᴜᴇʀʏ]
║ ─ ᴄᴏʟᴏʀɪᴢᴇ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '6': {
                title: "🎎 ᴀɴɪᴍᴇ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  🎎 ᴀɴɪᴍᴇ ᴍᴇɴᴜ
╚══════════════════╝

╔═════❰ 📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🎎 ᴄᴏᴍᴍᴀɴᴅs: 26
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔═════❰ 🖼️ ɪᴍᴀɢᴇs ❱═════╗
║ ─ ᴡᴀɪғᴜ
║ ─ ɴᴇᴋᴏ
║ ─ ᴍᴇɢɴᴜᴍɪɴ
║ ─ ᴍᴀɪᴅ
║ ─ ʟᴏʟɪ
║ ─ ᴅᴏɢ
║ ─ ᴀᴡᴏᴏ
║ ─ ɢᴀʀʟ
╚══════════════════╝

╔════❰ 🎭 ᴄʜᴀʀᴀᴄᴛᴇʀs ❱═══╗
║ ─ ᴀɴɪᴍᴇɢɪʀʟ
║ ─ ᴀɴɪᴍᴇɢɪʀʟ1-5
║ ─ ᴀɴɪᴍᴇ1-5
║ ─ ғᴏxɢɪʀʟ
║ ─ ɴᴀʀᴜᴛᴏ
╚═══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '7': {
                title: "🔄 ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  🔄 ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ
╚══════════════════╝

╔════❰  📊 sᴛᴀᴛᴜs ❱═════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🔄 ᴄᴏᴍᴍᴀɴᴅs: 19
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔══════❰ 🖼️ ᴍᴇᴅɪᴀ ❱═════╗
║ ─ sᴛɪᴄᴋᴇʀ [ɪᴍɢ]
║ ─ sᴛɪᴄᴋᴇʀ2 [ɪᴍɢ]
║ ─ ᴇᴍᴏᴊɪᴍɪx 😎+😂
║ ─ ᴛᴀᴋᴇ [ɴᴀᴍᴇ,ᴛᴇxᴛ]
║ ─ ᴛᴏᴍᴘ3 [ᴠɪᴅᴇᴏ]
╚══════════════════╝

╔═════❰ 🔤 ᴛᴇxᴛ ᴛᴏᴏʟs ❱══╗
║ ─ ғᴀᴋᴇᴄʜᴀᴛ
║ ─ ғᴀɴᴄʏ [ᴛᴇxᴛ]
║ ─ ᴛᴛs [ᴛᴇxᴛ]
║ ─ ᴛʀᴛ [ᴛᴇxᴛ]
║ ─ ʙᴀsᴇ64 [ᴛᴇxᴛ]
║ ─ ᴜɴʙᴀsᴇ64 [ᴛᴇxᴛ]
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '8': {
                title: "📌 ᴏᴛʜᴇʀ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  📌 ᴏᴛʜᴇʀ ᴍᴇɴᴜ
╚══════════════════╝

╔═════❰  📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 📌 ᴄᴏᴍᴍᴀɴᴅs: 15
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔════❰ 🕒 ᴜᴛɪʟɪᴛɪᴇs ❱═════╗
║ ─ ᴛɪᴍᴇɴᴏᴡ
║ ─ ᴅᴀᴛᴇ
║ ─ ᴄᴏᴜɴᴛ [ɴᴜᴍ]
║ ─ ᴄᴀʟᴄᴜʟᴀᴛᴇ [ᴇxᴘʀ]
║ ─ ᴄᴏᴜɴᴛx
╚══════════════════╝

╔════❰ 🎲 ʀᴀɴᴅᴏᴍ ❱═════╗
║ ─ 𝚒𝚙𝚑𝚘𝚗𝚎𝚌𝚑𝚊𝚝
║ ─ ғʟɪᴘ
║ ─ ᴄᴏɪɴғʟɪᴘ
║ ─ ʀᴄᴏʟᴏʀ
║ ─ ʀᴏʟʟ
║ ─ ғᴀᴄᴛ
║ ─ ʷᵉˡᶜᵒᵐᵉⁱᵐᵍ
║ ─ ᶠᵒʳʷᵃʳᵈ
║ ─ ᶠᵒʳʷᵃʳᵈᵃˡˡ
║ ─ ᶠᵒʳʷᵃʳᵈᵍʳᵒᵘᵖ
║ ─ sᴀᴠᴇ
╚══════════════════╝

╔═════❰  🔍 sᴇᴀʀᴄʜ ❱════╗
║ ─ ᴅᴇғɪɴᴇ [ᴡᴏʀᴅ]
║ ─ ɴᴇᴡs [ǫᴜᴇʀʏ]
║ ─ ᴍᴏᴠɪᴇ [ɴᴀᴍᴇ]
║ ─ ᴡᴇᴀᴛʜᴇʀ [ʟᴏᴄ]
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '9': {
                title: "💞 ʀᴇᴀᴄᴛɪᴏɴs ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  💞 ʀᴇᴀᴄᴛɪᴏɴs ᴍᴇɴᴜ
╚══════════════════╝

╔═════❰  📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 💞 ᴄᴏᴍᴍᴀɴᴅs: 26
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔════❰ 💗 ᴀғғᴇᴄᴛɪᴏɴ ❱════╗
║ ─ ᴄᴜᴅᴅʟᴇ @ᴜsᴇʀ
║ ─ ʜᴜɢ @ᴜsᴇʀ
║ ─ ᴋɪss @ᴜsᴇʀ
║ ─ ʟɪᴄᴋ @ᴜsᴇʀ
║ ─ ᴘᴀᴛ @ᴜsᴇʀ
╚══════════════════╝

╔═════❰ 😄  ғᴜɴɴʏ ❱═════╗
║ ─ ʙᴜʟʟʏ @ᴜsᴇʀ
║ ─ ʙᴏɴᴋ @ᴜsᴇʀ
║ ─ ʏᴇᴇᴛ @ᴜsᴇʀ
║ ─ sʟᴀᴘ @ᴜsᴇʀ
║ ─ ᴋɪʟʟ @ᴜsᴇʀ
╚══════════════════╝

╔══❰ 😊 ᴇxᴘʀᴇssɪᴏɴs ❱════╗
║ ─ ʙʟᴜsʜ @ᴜsᴇʀ
║ ─ sᴍɪʟᴇ @ᴜsᴇʀ
║ ─ ʜᴀᴘᴘʏ @ᴜsᴇʀ
║ ─ ᴡɪɴᴋ @ᴜsᴇʀ
║ ─ ᴘᴏᴋᴇ @ᴜsᴇʀ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            },
            '10': {
                title: "🏠 ᴍᴀɪɴ ᴍᴇɴᴜ",
                content: `╔══════════════════╗
║  ${botName}
║  🏠 ᴍᴀɪɴ ᴍᴇɴᴜ
╚══════════════════╝

╔══════❰ 📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 🏠 ᴄᴏᴍᴍᴀɴᴅs: 10
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔════❰ 🤖 ʙᴏᴛ ɪɴғᴏ ❱════╗
║ ─ ᴘɪɴɢ
║ ─ ʟɪᴠᴇ
║ ─ ᴀʟɪᴠᴇ
║ ─ ʀᴜɴᴛɪᴍᴇ
║ ─ ᴜᴘᴛɪᴍᴇ
║ ─ ʀᴇᴘᴏ
║ ─ ᴏᴡɴᴇʀ
║ ─ ʙɪᴏ
╚══════════════════╝

╔════❰ ⚙️ ᴄᴏɴᴛʀᴏʟs ❱════╗
║ ─ ᴍᴇɴᴜ
║ ─ ᴍᴇɴᴜ2
║ ─ ʀᴇsᴛᴀʀᴛ
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 TEDDY-XMD'}`,
                image: true
            }
        };

        // Message handler
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation || 
                                      receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];
                        
                        try {
                            await conn.sendMessage(senderID, {
                                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/9yy6iy.jpg' },
                                caption: selectedMenu.content,
                                contextInfo: contextInfo
                            }, { quoted: receivedMsg });

                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });

                        } catch (e) {
                            await conn.sendMessage(senderID, {
                                text: selectedMenu.content,
                                contextInfo: contextInfo
                            }, { quoted: receivedMsg });
                        }

                    } else {
                        await conn.sendMessage(senderID, {
                            text: `❌ ɪɴᴠᴀʟɪᴅ ᴏᴘᴛɪᴏɴ!\n\nᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ ʙᴇᴛᴡᴇᴇɴ 1-10\n\n> ${config.DESCRIPTION || 'ᴅᴀʀᴋᴢᴏɴᴇ-ᴍᴅ'}`,
                            contextInfo: contextInfo
                        }, { quoted: receivedMsg });
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        conn.ev.on("messages.upsert", handler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ ᴍᴇɴᴜ ᴇʀʀᴏʀ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.`);
    }
});
