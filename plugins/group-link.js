const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

// Function to check admin status with LID support
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        // Extract bot information
        const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
        const botIdWithoutSuffix = botId.includes('@') ? botId.split('@')[0] : botId;
        const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        const botLidWithoutSuffix = botLid.includes('@') ? botLid.split('@')[0] : botLid;
        
        // Extract sender information
        const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const senderIdWithoutSuffix = senderId.includes('@') ? senderId.split('@')[0] : senderId;
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                // Check participant IDs
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';
                
                // Extract numeric part from participant LID
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
                
                // Check if this participant is the bot
                const botMatches = (
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumeric === pLidNumeric ||
                    botLidWithoutSuffix === pLid ||
                    botNumber === pPhoneNumber ||
                    botNumber === pId ||
                    botIdWithoutSuffix === pPhoneNumber ||
                    botIdWithoutSuffix === pId ||
                    (botLid && botLid.split('@')[0].split(':')[0] === pLid)
                );
                
                if (botMatches) {
                    isBotAdmin = true;
                }
                
                // Check if this participant is the sender
                const senderMatches = (
                    senderId === pFullId ||
                    senderId === pFullLid ||
                    senderNumber === pPhoneNumber ||
                    senderNumber === pId ||
                    senderIdWithoutSuffix === pPhoneNumber ||
                    senderIdWithoutSuffix === pId ||
                    (pLid && senderIdWithoutSuffix === pLid)
                );
                
                if (senderMatches) {
                    isSenderAdmin = true;
                }
            }
        }
        
        return { isBotAdmin, isSenderAdmin };
        
    } catch (err) {
        console.error('❌ Error checking admin status:', err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// Function to extract display number from any ID format
function extractDisplayNumber(id) {
    if (!id) return 'Unknown';
    if (id.includes(':')) {
        return id.split(':')[0];
    }
    if (id.includes('@')) {
        return id.split('@')[0];
    }
    return id;
}

cmd({
    pattern: "invite",
    alias: ["glink", "grouplink", "link", "getlink"],
    desc: "Get group invite link.",
    react: "🔗",
    category: "group",
    filename: __filename,
}, 
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        // Ensure this is being used in a group
        if (!isGroup) return reply("❌ This command can only be used in groups!");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        // Check if bot is admin
        if (!isBotAdmin) return reply("❌ I need to be an admin to get the group invite link!");

        // Check if sender is admin
        if (!isSenderAdmin) return reply("❌ Only group admins can use this command!");

        // Get the invite code
        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) return reply("❌ Failed to retrieve the invite code.");

        // Generate the full invite link
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // Get group metadata for additional info
        const groupMetadata = await conn.groupMetadata(from);
        const groupName = groupMetadata.subject || 'Unknown Group';
        const memberCount = groupMetadata.size || groupMetadata.participants?.length || 0;

        // Get sender number for display
        const senderNum = extractDisplayNumber(senderId);

        // Try to get group profile picture
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // Create formatted message
        const linkMessage = `╭━━━━━━━━━━━━━━━━╮
┃  *「 GROUP INVITE LINK 」*
╰━━━━━━━━━━━━━━━━╯

📛 *Group Name:* 
${groupName}

👥 *Members:* ${memberCount}

🔗 *Invite Link:*
${inviteLink}

👤 *Requested By:* @${senderNum}

📅 *Generated:* ${new Date().toLocaleString()}

⚠️ _Share this link carefully!_`;

        // Send message with group photo
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: linkMessage,
            mentions: [senderId]
        }, { quoted: mek });

    } catch (error) {
        console.error("Error in invite command:", error);
        
        if (error.message?.includes('not-authorized')) {
            reply("❌ I don't have permission to get the invite link!");
        } else if (error.message?.includes('429')) {
            reply("❌ Rate limit reached. Please try again in a few seconds.");
        } else {
            reply(`❌ An error occurred: ${error.message || "Unknown error"}`);
        }
    }
});