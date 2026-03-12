const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

cmd({
    pattern: "join",
    react: "⚙️",
    alias: ["j", "gog", "gc"],
    desc: "To Join a Group from Invite link",
    category: "group",
    use: '.join < Group Link >',
    filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        // Only allow the owner to use the command
        if (!isCreator) return reply("❌ This command can only be used by my owner!");

        // If there's no input, check if the message is a reply with a link
        if (!q && !quoted) return reply("*Please provide a Group Link* 🖇️");

        let groupLink;

        // If the message is a reply to a group invite link
        if (quoted && quoted.type === 'conversation' && isUrl(quoted.text)) {
            groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
        } else if (q && isUrl(q)) {
            // If the user provided the link in the command
            groupLink = q.split('https://chat.whatsapp.com/')[1];
        }

        if (!groupLink) return reply("❌ *Invalid Group Link Format* 🖇️");

        // Remove any query parameters from the link
        groupLink = groupLink.split('?')[0];

        // Contact-style quote
        let gift = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: `𝗞𝗛𝗔𝗡-𝗠𝗗`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:'GIFTED'\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            }
        };

        try {
            // Accept the group invite
            await conn.groupAcceptInvite(groupLink);
            await conn.sendMessage(from, { text: `✔️ *Successfully Joined The Group*` }, { quoted: gift });
            await m.react("✅");

        } catch (e) {
            console.log(e);
            
            if (e.message && e.message.includes("already") || e.status === 409) {
                return reply("❌ *I'm already in this group!*", { quoted: gift });
            } else if (e.message && (e.message.includes("reset") || e.message.includes("expired") || e.message.includes("gone"))) {
                return reply("❌ *This link has expired or been reset! Please provide a new valid link.*", { quoted: gift });
            } else if (e.message && (e.message.includes("invalid") || e.message.includes("bad-request"))) {
                return reply("❌ *Invalid group link! Please provide a valid WhatsApp group invite link.*", { quoted: gift });
            } else {
                return reply(`❌ *Error Occurred!!*\n\n${e.message}`, { quoted: gift });
            }
        }

    } catch (e) {
        console.log(e);
        reply(`❌ *Unexpected Error!*`);
    }
});