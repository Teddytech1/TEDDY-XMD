
const { cmd } = require('../command');

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

// Function to check if target is the bot itself
function isTargetBot(conn, targetId) {
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    
    const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
    
    const targetNumber = targetId.includes(':') ? targetId.split(':')[0] : (targetId.includes('@') ? targetId.split('@')[0] : targetId);
    
    return (
        botId === targetId ||
        botLid === targetId ||
        botNumber === targetNumber ||
        botLidNumeric === targetNumber
    );
}

// Function to check if target is owner/superadmin
async function isTargetOwner(conn, chatId, targetId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const targetNumber = targetId.includes(':') ? targetId.split(':')[0] : (targetId.includes('@') ? targetId.split('@')[0] : targetId);
        const targetIdWithoutSuffix = targetId.includes('@') ? targetId.split('@')[0] : targetId;
        
        for (let p of participants) {
            if (p.admin === "superadmin") {
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';
                
                const targetMatches = (
                    targetId === pFullId ||
                    targetId === pFullLid ||
                    targetNumber === pPhoneNumber ||
                    targetNumber === pId ||
                    targetIdWithoutSuffix === pPhoneNumber ||
                    targetIdWithoutSuffix === pId ||
                    (pLid && targetIdWithoutSuffix === pLid)
                );
                
                if (targetMatches) {
                    return true;
                }
            }
        }
        return false;
    } catch (err) {
        console.error('❌ Error checking owner status:', err);
        return false;
    }
}

cmd({
    pattern: "kick",
    alias: ["remove", "k"],
    desc: "Remove a group member (admins only)",
    category: "admin",
    react: "🗑️",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        if (!citel.isGroup) return citel.reply("❌ This command works only in groups!");

        // Get sender ID with LID support
        const senderId = citel.key?.participant || citel.sender || citel.key?.remoteJid;
        if (!senderId) return citel.reply("❌ Could not identify sender.");

        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(Void, citel.chat, senderId);

        if (!isSenderAdmin) return citel.reply("❌ Only *group admins* can use this command!");
        if (!isBotAdmin) return citel.reply("❌ I need to be an admin to kick members!");

        // Get target user (mentioned or quoted)
        const target = citel.quoted?.sender || citel.mentionedJid?.[0];
        if (!target) return citel.reply("❌ Mention or reply to the user you want to kick!");

        // Prevent kicking itself
        if (isTargetBot(Void, target)) {
            return citel.reply("❌ I can't kick myself!");
        }

        // Prevent kicking the group owner
        const targetIsOwner = await isTargetOwner(Void, citel.chat, target);
        if (targetIsOwner) {
            return citel.reply("❌ I can't kick the group owner!");
        }

        // Kick target
        await Void.groupParticipantsUpdate(citel.chat, [target], "remove");

        // Extract numbers for display
        const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const targetNumber = target.includes(':') ? target.split(':')[0] : (target.includes('@') ? target.split('@')[0] : target);

        // Success message
        await citel.reply(`🚫 @${targetNumber} has been kicked by admin @${senderNumber}`, {
            mentions: [target, senderId]
        });

    } catch (error) {
        console.error("[KICK ERROR]", error);
        citel.reply("❌ Failed to kick. Maybe I lost admin rights or target is a super-admin?");
    }
});