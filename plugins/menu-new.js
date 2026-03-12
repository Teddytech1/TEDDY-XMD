/**
 * ╔══════════════════════════════════════╗
 * ║        AUTO DYNAMIC MENU             ║
 * ║  Auto-reads ALL plugin files &       ║
 * ║  builds menu from real commands      ║
 * ║  Supports: Image + Video thumbnail   ║
 * ╚══════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');

// ══════════════════════════════════════════
//  CATEGORY DISPLAY CONFIG
//  Maps raw category names → display label + emoji
// ══════════════════════════════════════════
const CATEGORY_MAP = {
    // AI
    'ai':           { label: 'AI TOOLS',        emoji: '🤖', section: 'ai' },
    'ai-tools':     { label: 'AI TOOLS',        emoji: '🤖', section: 'ai' },
    // Download
    'download':     { label: 'DOWNLOAD',        emoji: '📥', section: 'download' },
    'downloader':   { label: 'DOWNLOAD',        emoji: '📥', section: 'download' },
    'audio':        { label: 'DOWNLOAD',        emoji: '📥', section: 'download' },
    'media':        { label: 'DOWNLOAD',        emoji: '📥', section: 'download' },
    // Group
    'group':        { label: 'GROUP',           emoji: '👥', section: 'group' },
    'admin':        { label: 'GROUP',           emoji: '👥', section: 'group' },
    'security':     { label: 'GROUP',           emoji: '👥', section: 'group' },
    // Fun
    'fun':          { label: 'FUN',             emoji: '😄', section: 'fun' },
    // Owner
    'owner':        { label: 'OWNER',           emoji: '👑', section: 'owner' },
    // Image / Sticker
    'image':        { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'image-tools':  { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'img_edit':     { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'sticker':      { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'maker':        { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'logo':         { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    'wallpapers':   { label: 'IMAGE/STICKER',   emoji: '🖼️', section: 'image' },
    // Anime
    'anime':        { label: 'ANIME',           emoji: '🎎', section: 'anime' },
    // Tools / Convert
    'tools':        { label: 'TOOLS',           emoji: '🛠️', section: 'tools' },
    'convert':      { label: 'TOOLS',           emoji: '🛠️', section: 'tools' },
    'converter':    { label: 'TOOLS',           emoji: '🛠️', section: 'tools' },
    'utilities':    { label: 'TOOLS',           emoji: '🛠️', section: 'tools' },
    'utility':      { label: 'TOOLS',           emoji: '🛠️', section: 'tools' },
    // Main / Info
    'main':         { label: 'MAIN',            emoji: '🏠', section: 'main' },
    'info':         { label: 'MAIN',            emoji: '🏠', section: 'main' },
    'information':  { label: 'MAIN',            emoji: '🏠', section: 'main' },
    // Other / Misc
    'other':        { label: 'OTHER',           emoji: '📌', section: 'other' },
    'misc':         { label: 'OTHER',           emoji: '📌', section: 'other' },
    'privacy':      { label: 'OTHER',           emoji: '📌', section: 'other' },
    'whatsapp':     { label: 'OTHER',           emoji: '📌', section: 'other' },
    'settings':     { label: 'OTHER',           emoji: '📌', section: 'other' },
    'news':         { label: 'OTHER',           emoji: '📌', section: 'other' },
    'search':       { label: 'OTHER',           emoji: '📌', section: 'other' },
    'stalker':      { label: 'OTHER',           emoji: '📌', section: 'other' },
    'env':          { label: 'OTHER',           emoji: '📌', section: 'other' },
    // Menu / skip
    'menu':         { label: null, section: 'skip' },
    'menu3':        { label: null, section: 'skip' },
};

// Section order for final display
const SECTION_ORDER = ['main','download','group','fun','owner','ai','image','anime','tools','other','new'];

// ══════════════════════════════════════════
//  CORE: auto-read all plugin files
//  Returns { sectionName: [pattern, ...] }
// ══════════════════════════════════════════
function buildCommandMap() {
    const pluginsDir = path.join(__dirname);
    const sections = {};

    // Helper: ensure section array exists
    const addTo = (section, pattern) => {
        if (!sections[section]) sections[section] = [];
        if (!sections[section].includes(pattern)) sections[section].push(pattern);
    };

    let files;
    try {
        files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
    } catch (e) {
        return sections;
    }

    for (const file of files) {
        const filePath = path.join(pluginsDir, file);
        let src;
        try { src = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }

        // Extract all cmd({...}) blocks by finding pattern + category pairs
        // Strategy: find all pattern: "x" and the nearest category: "y" within ~300 chars
        const cmdBlockRegex = /cmd\s*\(\s*\{([\s\S]*?)\}\s*,/g;
        let blockMatch;
        while ((blockMatch = cmdBlockRegex.exec(src)) !== null) {
            const block = blockMatch[1];

            // Extract pattern
            const patMatch = block.match(/pattern\s*:\s*['"`]([^'"`]+)['"`]/);
            if (!patMatch) continue;
            const pattern = patMatch[1].trim();

            // Extract category
            const catMatch = block.match(/category\s*:\s*['"`]([^'"`]+)['"`]/);
            const rawCat = catMatch ? catMatch[1].trim().toLowerCase() : '';

            const mapped = CATEGORY_MAP[rawCat];
            if (mapped) {
                if (mapped.section === 'skip') continue; // skip menu/meta commands
                addTo(mapped.section, pattern);
            } else {
                // Unknown category → goes to 'new' (all-commands catch-all)
                addTo('new', pattern);
            }
        }
    }

    return sections;
}

// ══════════════════════════════════════════
//  BUILD: a single section block string
// ══════════════════════════════════════════
function buildSectionBlock(sectionKey, cmds) {
    const sectionMeta = {
        main:     { emoji: '🏠', label: 'ᴍᴀɪɴ ᴍᴇɴᴜ' },
        download: { emoji: '📥', label: 'ᴅᴏᴡɴʟᴏᴀᴅ' },
        group:    { emoji: '👥', label: 'ɢʀᴏᴜᴘ' },
        fun:      { emoji: '😄', label: 'ғᴜɴ' },
        owner:    { emoji: '👑', label: 'ᴏᴡɴᴇʀ' },
        ai:       { emoji: '🤖', label: 'ᴀɪ ᴛᴏᴏʟs' },
        image:    { emoji: '🖼️', label: 'ɪᴍᴀɢᴇ/sᴛɪᴄᴋᴇʀ' },
        anime:    { emoji: '🎎', label: 'ᴀɴɪᴍᴇ' },
        tools:    { emoji: '🛠️', label: 'ᴛᴏᴏʟs' },
        other:    { emoji: '📌', label: 'ᴏᴛʜᴇʀ' },
        new:      { emoji: '⚡', label: 'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs' },
    };
    const meta = sectionMeta[sectionKey] || { emoji: '🔹', label: sectionKey.toUpperCase() };
    const lines = cmds.map(c => `║ ─ ${c}`).join('\n');
    return `╔══❰ ${meta.emoji} ${meta.label} ❱══╗\n${lines}\n╚══════════════════╝`;
}

// ══════════════════════════════════════════
//  BUILD: full overview menu text
// ══════════════════════════════════════════
function buildFullMenu(sections, botName, ownerName, prefix, mode, uptime, ramUsed, totalRam, platform, currentDate, currentTime) {
    const totalCommands = Object.values(sections).reduce((a, b) => a + b.length, 0);
    const sectionCount = Object.keys(sections).filter(k => sections[k].length > 0).length;

    let header = `╔══════════════════╗
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

╔══❰ 📜 ᴍᴇɴᴜ sᴇᴄᴛɪᴏɴs ❱══╗`;

    // Build numbered section index
    const orderedSections = SECTION_ORDER.filter(k => sections[k] && sections[k].length > 0);
    const sectionEmojis = {
        main:'🏠',download:'📥',group:'👥',fun:'😄',owner:'👑',
        ai:'🤖',image:'🖼️',anime:'🎎',tools:'🛠️',other:'📌',new:'⚡'
    };
    const sectionLabels = {
        main:'ᴍᴀɪɴ',download:'ᴅᴏᴡɴʟᴏᴀᴅ',group:'ɢʀᴏᴜᴘ',fun:'ғᴜɴ',
        owner:'ᴏᴡɴᴇʀ',ai:'ᴀɪ',image:'ɪᴍᴀɢᴇ/sᴛɪᴄᴋᴇʀ',anime:'ᴀɴɪᴍᴇ',
        tools:'ᴛᴏᴏʟs',other:'ᴏᴛʜᴇʀ',new:'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs'
    };
    const numEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','🔢'];
    orderedSections.forEach((k, i) => {
        const count = sections[k].length;
        header += `\n║ ${numEmojis[i] || '🔹'}  ${sectionEmojis[k]} ${sectionLabels[k]} [${count}]`;
    });
    header += `\n╚══════════════════╝

> ʀᴇᴘʟʏ ᴡɪᴛʜ ɴᴜᴍʙᴇʀ ғᴏʀ ᴅᴇᴛᴀɪʟs

`;

    // Append each section block
    orderedSections.forEach(k => {
        header += buildSectionBlock(k, sections[k]) + '\n\n';
    });

    header += `> ${config.DESCRIPTION || '🌟 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ' + botName}`;
    return header;
}

// ══════════════════════════════════════════
//  BUILD: sub-menu text for a section
// ══════════════════════════════════════════
function buildSubMenu(sectionKey, cmds, botName, ownerName, uptime) {
    const sectionEmojis = {
        main:'🏠',download:'📥',group:'👥',fun:'😄',owner:'👑',
        ai:'🤖',image:'🖼️',anime:'🎎',tools:'🛠️',other:'📌',new:'⚡'
    };
    const sectionLabels = {
        main:'ᴍᴀɪɴ ᴍᴇɴᴜ',download:'ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',group:'ɢʀᴏᴜᴘ ᴍᴇɴᴜ',
        fun:'ғᴜɴ ᴍᴇɴᴜ',owner:'ᴏᴡɴᴇʀ ᴍᴇɴᴜ',ai:'ᴀɪ ᴍᴇɴᴜ',
        image:'ɪᴍᴀɢᴇ/sᴛɪᴄᴋᴇʀ ᴍᴇɴᴜ',anime:'ᴀɴɪᴍᴇ ᴍᴇɴᴜ',
        tools:'ᴛᴏᴏʟs ᴍᴇɴᴜ',other:'ᴏᴛʜᴇʀ ᴍᴇɴᴜ',new:'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs'
    };
    const emoji = sectionEmojis[sectionKey] || '🔹';
    const label = sectionLabels[sectionKey] || sectionKey;

    const lines = cmds.map(c => `║ ─ ${c}`).join('\n');
    return `╔══════════════════╗
║  ${botName}
║  ${emoji} ${label}
╚══════════════════╝

╔════❰ 📊 sᴛᴀᴛᴜs ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ${ownerName}
║ 📜 ᴄᴍᴅs: ${cmds.length}
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptime}
╚══════════════════╝

╔══❰ ${emoji} ᴄᴏᴍᴍᴀɴᴅs ❱══╗
${lines}
╚══════════════════╝

> ${config.DESCRIPTION || '🌟 ' + botName}`;
}

// ══════════════════════════════════════════
//   MAIN COMMAND: .automenu
// ══════════════════════════════════════════
cmd({
    pattern: "menu",
    alias: ["amenu", "fullmenu"],
    desc: "Show dynamic auto-generated menu from all plugins",
    category: "menu",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // ── System stats ──
        const uptime       = runtime(process.uptime());
        const ramUsed      = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam     = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const platform     = os.platform();
        const currentTime  = new Date().toLocaleTimeString();
        const currentDate  = new Date().toLocaleDateString();
        const botName      = config.BOT_NAME   || 'TEDDY-XMD';
        const ownerName    = config.OWNER_NAME || 'DEVELOPER';
        const prefix       = config.PREFIX     || '.';
        const mode         = config.MODE       || 'public';

        // ── Build command sections from live plugin folder ──
        const sections = buildCommandMap();
        const orderedSections = SECTION_ORDER.filter(k => sections[k] && sections[k].length > 0);

        // ── Build full menu text ──
        const menuText = buildFullMenu(
            sections, botName, ownerName, prefix, mode,
            uptime, ramUsed, totalRam, platform, currentDate, currentTime
        );

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363421104812135@newsletter',
                newsletterName: botName,
                serverMessageId: 143
            }
        };

        // ── Determine media type from config ──
        // Set MENU_VIDEO_URL in config for video, MENU_IMAGE_URL for image
        const videoUrl = config.MENU_VIDEO_URL || null;
        const imageUrl = config.MENU_IMAGE_URL || 'https://files.catbox.moe/9yy6iy.jpg';

        let sentMsg;
        try {
            if (videoUrl) {
                // Video thumbnail support
                sentMsg = await conn.sendMessage(from, {
                    video: { url: videoUrl },
                    caption: menuText,
                    gifPlayback: false,
                    contextInfo: contextInfo
                }, { quoted: mek });
            } else {
                sentMsg = await conn.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: menuText,
                    contextInfo: contextInfo
                }, { quoted: mek });
            }
        } catch (e) {
            // Fallback to plain text
            sentMsg = await conn.sendMessage(from, {
                text: menuText,
                contextInfo: contextInfo
            }, { quoted: mek });
        }

        const messageID = sentMsg.key.id;

        // ── Reply handler: user replies with section number ──
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                if (!isReplyToMenu) return;

                const receivedText = (
                    receivedMsg.message.conversation ||
                    receivedMsg.message.extendedTextMessage?.text || ''
                ).trim();

                const senderID = receivedMsg.key.remoteJid;

                // Map number → section key
                const numToSection = {};
                orderedSections.forEach((k, i) => { numToSection[String(i + 1)] = k; });

                const sectionKey = numToSection[receivedText];

                if (sectionKey && sections[sectionKey]) {
                    const subText = buildSubMenu(
                        sectionKey, sections[sectionKey], botName, ownerName, runtime(process.uptime())
                    );

                    try {
                        if (videoUrl) {
                            await conn.sendMessage(senderID, {
                                video: { url: videoUrl },
                                caption: subText,
                                gifPlayback: false,
                                contextInfo: contextInfo
                            }, { quoted: receivedMsg });
                        } else {
                            await conn.sendMessage(senderID, {
                                image: { url: imageUrl },
                                caption: subText,
                                contextInfo: contextInfo
                            }, { quoted: receivedMsg });
                        }
                    } catch {
                        await conn.sendMessage(senderID, {
                            text: subText,
                            contextInfo: contextInfo
                        }, { quoted: receivedMsg });
                    }

                    await conn.sendMessage(senderID, {
                        react: { text: '✅', key: receivedMsg.key }
                    });
                } else {
                    await conn.sendMessage(senderID, {
                        text: `❌ ɪɴᴠᴀʟɪᴅ ᴏᴘᴛɪᴏɴ!\n\nᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ ʙᴇᴛᴡᴇᴇɴ 1 - ${orderedSections.length}\n\n> ${config.DESCRIPTION || botName}`,
                        contextInfo: contextInfo
                    }, { quoted: receivedMsg });
                }
            } catch (e) {
                console.log('[automenu] handler error:', e.message);
            }
        };

        conn.ev.on('messages.upsert', handler);
        // Auto-cleanup after 5 minutes
        setTimeout(() => conn.ev.off('messages.upsert', handler), 300000);

    } catch (e) {
        console.error('[automenu] Error:', e);
        reply('❌ ᴀᴜᴛᴏ ᴍᴇɴᴜ ᴇʀʀᴏʀ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
    }
});

// ══════════════════════════════════════════
//   BONUS COMMAND: .setmenuvideo <url>
//   Lets owner set video URL at runtime
// ══════════════════════════════════════════
cmd({
    pattern: "setmenuvideo",
    alias: ["vidmenu"],
    use: '.setmenuvideo <video_url>',
    desc: "Set menu thumbnail to a video URL (owner only)",
    category: "owner",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Owner only command!");
    const url = args[0];
    if (!url) return reply("❌ Usage: .setmenuvideo <direct_video_url>");
    config.MENU_VIDEO_URL = url;
    reply(`✅ *Menu video set!*\n\n🎥 URL: ${url}\n\n> Use .automenu to see it in action!`);
});

// ══════════════════════════════════════════
//   BONUS COMMAND: .setmenuimage <url>
//   Lets owner set image URL at runtime
// ══════════════════════════════════════════
