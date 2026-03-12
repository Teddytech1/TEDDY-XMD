const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');

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

cmd({
    pattern: "updategdesc",
    alias: ["upgdesc", "gdesc", "setdesc", "setgdesc"],
    react: "📜",
    desc: "Change the group description.",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, args, q, reply }) => {
    try {
        // Check if in group
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        // Check if sender is admin
        if (!isSenderAdmin) return reply("❌ Only group admins can use this command.");
        
        // Check if bot is admin
        if (!isBotAdmin) return reply("❌ I need to be an admin to update the group description.");
        
        // Check if description text is provided
        if (!q || q.trim() === '') {
            return reply("❌ Please provide a new group description.\n\n*Example:*\n.updategdesc Welcome to our group! Follow the rules.");
        }

        // Update the group description
        await conn.groupUpdateDescription(from, q);

        // Get sender number for display
        const senderNum = senderId.includes(':') 
            ? senderId.split(':')[0] 
            : (senderId.includes('@') ? senderId.split('@')[0] : senderId);

        // Success message
        const successMessage = `✅ *Group Description Updated!*\n\n` +
            `📜 *New Description:*\n${q}\n\n` +
            `👤 *Updated By:* @${senderNum}\n` +
            `📅 *Date:* ${new Date().toLocaleString()}`;

        await reply(successMessage, {
            mentions: [senderId]
        });

    } catch (e) {
        console.error("Error updating group description:", e);
        
        if (e.message?.includes('not-authorized')) {
            reply("❌ I don't have permission to update the group description.");
        } else if (e.message?.includes('429')) {
            reply("❌ Rate limit reached. Please try again in a few seconds.");
        } else {
            reply("❌ Failed to update the group description. Please try again.");
        }
    }
});