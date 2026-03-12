const config = require('../config')
const { cmd } = require('../command')

cmd({
    pattern: "hidetag",
    react: "👻",
    alias: ["notify"],
    desc: "Tag all members without showing the tag list",
    category: "group",
    use: '.hidetag [message]',
    filename: __filename
},
async (conn, mek, m, { from, body, command, isGroup, reply }) => {
    try {
        // Check if in group
        if (!isGroup) return reply("❌ This command can only be used in groups!");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Show processing reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Get group metadata
        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ Failed to fetch group information.");
        }

        let participants = groupInfo.participants || [];

        // Check if sender is admin
        const isAdmin = participants.some(p => {
            const pId = p.id ? p.id.split('@')[0] : '';
            const sendId = senderId.split('@')[0];
            return (pId === sendId || p.id === senderId) && (p.admin === "admin" || p.admin === "superadmin");
        });

        if (!isAdmin) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ This command is only for group admins!");
        }

        // Get all participant IDs for mentions
        const allParticipantIds = participants.map(p => p.id).filter(Boolean);

        // Extract message from command
        let message = body.slice(body.indexOf(command) + command.length).trim();

        // Check if replying to a message
        const quotedMsg = mek.quoted;

        if (quotedMsg) {
            // Forward the quoted message with hidden mentions
            try {
                await conn.sendMessage(from, {
                    forward: quotedMsg,
                    mentions: allParticipantIds
                }, { quoted: mek });
            } catch (err) {
                // Fallback method
                const msgType = Object.keys(quotedMsg.message || {})[0];
                const msgContent = quotedMsg.message[msgType];
                
                await conn.sendMessage(from, {
                    [msgType]: msgContent,
                    mentions: allParticipantIds
                }, { quoted: mek });
            }
        } else {
            // Send text message with hidden mentions
            const textToSend = message || "";
            
            await conn.sendMessage(from, {
                text: textToSend,
                mentions: allParticipantIds
            });
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: '👻', key: mek.key } });

    } catch (e) {
        console.error("HideTag Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error occurred: ${e.message || e}`);
    }
});
