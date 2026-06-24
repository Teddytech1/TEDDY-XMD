const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

const MENU_IMAGE_URL = "https://files.catbox.moe/9yy6iy.jpg";

// =====================
// Greeting Logic
// =====================

const getGreeting = () => {
    const hour = moment().tz('Africa/Nairobi').hour();

    if (hour >= 5 && hour < 12) return "Good Morning 🌅";
    if (hour >= 12 && hour < 17) return "Good Afternoon ☀️";
    if (hour >= 17 && hour < 21) return "Good Evening 🌆";
    return "Good Night 😴";
};

// =====================
// MENU COMMAND
// =====================

cmd({
    pattern: "menu2",
    alias: ["help2", "allmenu2"],
    react: "✨",
    category: "main",
    desc: "Show bot menu",
    filename: __filename
},
async (conn, mek, m, { from, sender, pushName, reply }) => {

    try {

        // Fake vCard Quote
        const fakevCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "TEDDY-XMD",
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:TEDDY
ORG:TEDDY-XMD;
TEL;type=CELL;type=VOICE;waid=254000000000:+254000000000
END:VCARD`
                }
            }
        };

        const now = moment().tz("Africa/Nairobi");
        const date = now.format("DD/MM/YYYY");
        const time = now.format("HH:mm:ss");

        const userName =
            pushName ||
            mek.pushName ||
            conn.getName(sender) ||
            "User";

        const greeting = getGreeting();

        // =====================
        // Organize Commands
        // =====================

        const commandsByCategory = {};

        const activeCommands = commands.filter(
            cmd => cmd.pattern && !cmd.dontAdd && cmd.category
        );

        const totalCommands = activeCommands.length;

        activeCommands.forEach(cmd => {
            const category = cmd.category.toUpperCase();
            const name = cmd.pattern.split("|")[0].trim();

            if (!commandsByCategory[category]) {
                commandsByCategory[category] = [];
            }

            commandsByCategory[category].push(name);
        });

        const sortedCategories =
            Object.keys(commandsByCategory).sort();

        // =====================
        // Header
        // =====================

        let menu = `
╭━━━〔 *TEDDY-XMD* 〕━━━⊷
┃ ${greeting}
┃
┃ 👤 User : ${userName}
┃ 📅 Date : ${date}
┃ ⏰ Time : ${time}
┃ ⭐ Commands : ${totalCommands}
╰━━━━━━━━━━━━━━━━⊷
`;

        // =====================
        // Categories
        // =====================

        for (const category of sortedCategories) {

            menu += `\n╭━━━〔 *${category} MENU* 〕━━━⊷\n`;

            const sortedCommands =
                commandsByCategory[category].sort();

            for (const cmdName of sortedCommands) {
                menu += `┃ ✦ ${config.PREFIX}${cmdName}\n`;
            }

            menu += `╰━━━━━━━━━━━━━━━━⊷\n`;
        }

        // =====================
        // Footer
        // =====================

        menu += `
╭━━━━━━━━━━━━━━━━⊷
┃ *TEDDY-XMD BOT*
┃ Powered By TEDDY
╰━━━━━━━━━━━━━━━━⊷
`;

        // =====================
        // Context Info
        // =====================

        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid:
                    config.NEWSLETTER_JID ||
                    '120363421104812135@newsletter',

                newsletterName:
                    config.OWNER_NAME || 'TEDDY',

                serverMessageId: 1
            }
        };

        // =====================
        // Send Menu
        // =====================

        await conn.sendMessage(
            from,
            {
                image: { url: MENU_IMAGE_URL },
                caption: menu,
                contextInfo: {
                    ...newsletterContextInfo,

                    externalAdReply: {
                        title: "TEDDY-XMD",
                        body: `${greeting} ${userName}`,
                        thumbnailUrl: MENU_IMAGE_URL,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        sourceUrl: ""
                    }
                }
            },
            { quoted: fakevCard }
        );

    } catch (e) {
        console.log(e);
        reply("❌ Error loading menu.");
    }

});