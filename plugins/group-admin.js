const { cmd } = require('../command');
const config = require('../config');

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

// Function to check if user is authorized with LID support
function isAuthorizedUser(senderId) {
    // Extract sender number from various formats
    const senderNumber = senderId.includes(':') 
        ? senderId.split(':')[0] 
        : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
    
    // Get DEV number from config
    const devNumber = config.DEV 
        ? (config.DEV.includes('@') ? config.DEV.split('@')[0] : config.DEV)
        : '';
    
    // Authorized numbers (add your authorized numbers here)
    const AUTHORIZED_NUMBERS = [
        devNumber,
        "923427582273"  // Your hardcoded authorized number
    ].filter(Boolean);
    
    // Check if sender matches any authorized number
    return AUTHORIZED_NUMBERS.some(authNum => {
        const authNumClean = authNum.includes(':') ? authNum.split(':')[0] : authNum;
        return senderNumber === authNumClean || 
               senderNumber === authNum ||
               authNumClean === senderNumber;
    });
}

// Function to find sender's participant ID and check if already admin
async function getSenderParticipantInfo(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const senderNumber = senderId.includes(':') 
            ? senderId.split(':')[0] 
            : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const senderIdWithoutSuffix = senderId.includes('@') ? senderId.split('@')[0] : senderId;
        
        for (let p of participants) {
            const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
            const pId = p.id ? p.id.split('@')[0] : '';
            const pLid = p.lid ? p.lid.split('@')[0] : '';
            const pFullId = p.id || '';
            const pFullLid = p.lid || '';
            
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
                return {
                    found: true,
                    participantId: p.id,  // This is the correct ID to use for promotion
                    isAdmin: p.admin === "admin" || p.admin === "superadmin",
                    isSuperAdmin: p.admin === "superadmin"
                };
            }
        }
        
        return { found: false, participantId: null, isAdmin: false, isSuperAdmin: false };
        
    } catch (err) {
        console.error('❌ Error getting sender participant info:', err);
        return { found: false, participantId: null, isAdmin: false, isSuperAdmin: false };
    }
}

cmd({
    pattern: "admin",
    alias: ["takeadmin", "makeadmin"],
    desc: "Take adminship for authorized users",
    category: "owner",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        // Verify group context
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check if bot is admin using LID-supported function
        const { isBotAdmin } = await checkAdminStatus(conn, from, senderId);
        
        if (!isBotAdmin) return reply("❌ I need to be an admin to perform this action.");

        // Check if sender is authorized
        if (!isAuthorizedUser(senderId)) {
            return reply("❌ This command is restricted to authorized users only.");
        }

        // Get sender's participant info
        const senderInfo = await getSenderParticipantInfo(conn, from, senderId);
        
        if (!senderInfo.found) {
            return reply("❌ Could not find you in the group participants.");
        }

        // Check if already admin
        if (senderInfo.isAdmin) {
            return reply("ℹ️ You're already an admin in this group.");
        }

        // Promote to admin using the correct participant ID
        await conn.groupParticipantsUpdate(from, [senderInfo.participantId], "promote");
        
        // Get sender number for display
        const senderNum = senderId.includes(':') 
            ? senderId.split(':')[0] 
            : (senderId.includes('@') ? senderId.split('@')[0] : senderId);

        return reply(`✅ Successfully granted admin rights to @${senderNum}!`, {
            mentions: [senderInfo.participantId]
        });
        
    } catch (error) {
        console.error("Admin command error:", error);
        
        if (error.message?.includes('not-authorized')) {
            return reply("❌ I don't have permission to promote users in this group.");
        } else if (error.message?.includes('429')) {
            return reply("❌ Rate limit reached. Please try again in a few seconds.");
        }
        
        return reply("❌ Failed to grant admin rights. Error: " + error.message);
    }
});