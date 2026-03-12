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

// Function to check if user is owner with LID support
function isOwnerUser(senderId) {
    const senderNumber = senderId.includes(':') 
        ? senderId.split(':')[0] 
        : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
    
    const ownerNumbers = [];
    
    if (config.OWNER_NUMBER) {
        const ownerNum = config.OWNER_NUMBER.includes('@') 
            ? config.OWNER_NUMBER.split('@')[0] 
            : config.OWNER_NUMBER;
        ownerNumbers.push(ownerNum.includes(':') ? ownerNum.split(':')[0] : ownerNum);
    }
    
    if (config.DEV) {
        const devNum = config.DEV.includes('@') 
            ? config.DEV.split('@')[0] 
            : config.DEV;
        ownerNumbers.push(devNum.includes(':') ? devNum.split(':')[0] : devNum);
    }
    
    if (config.SUDO) {
        const sudoList = config.SUDO.split(',').map(num => {
            const cleaned = num.trim();
            const extracted = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
            return extracted.includes(':') ? extracted.split(':')[0] : extracted;
        });
        ownerNumbers.push(...sudoList);
    }
    
    const validOwnerNumbers = ownerNumbers.filter(Boolean);
    
    return validOwnerNumbers.some(ownerNum => {
        return senderNumber === ownerNum || 
               senderNumber === ownerNum.replace(/[^0-9]/g, '');
    });
}

// Function to extract phone number from participant
function extractPhoneNumber(participant) {
    // Try phoneNumber field first
    if (participant.phoneNumber) {
        const num = participant.phoneNumber.includes('@') 
            ? participant.phoneNumber.split('@')[0] 
            : participant.phoneNumber;
        return num.includes(':') ? num.split(':')[0] : num;
    }
    
    // Try id field
    if (participant.id) {
        const id = participant.id;
        // If it's a regular phone number format
        if (id.includes('@s.whatsapp.net')) {
            const num = id.split('@')[0];
            return num.includes(':') ? num.split(':')[0] : num;
        }
        // If it looks like a phone number (starts with country code)
        const numPart = id.split('@')[0];
        if (/^\d+/.test(numPart)) {
            return numPart.includes(':') ? numPart.split(':')[0] : numPart;
        }
    }
    
    return null;
}

// Function to check if participant is admin
function isParticipantAdmin(participant) {
    return participant.admin === "admin" || participant.admin === "superadmin";
}

// Function to check if target is the bot
function isTargetBot(conn, participantId) {
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    
    const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
    
    const targetNumber = participantId.includes(':') ? participantId.split(':')[0] : (participantId.includes('@') ? participantId.split('@')[0] : participantId);
    
    return (
        botId === participantId ||
        botLid === participantId ||
        botNumber === targetNumber ||
        botLidNumeric === targetNumber
    );
}

// Function to extract display number
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
    pattern: "out",
    alias: ["ck", "countykick", "kickcountry", "removecountry"],
    desc: "Removes all members with specific country code from the group",
    category: "admin",
    react: "🦶",
    use: ".out <country_code>",
    filename: __filename
},
async (conn, mek, m, { from, q, isGroup, reply }) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        // Check if sender is admin or owner
        const isOwner = isOwnerUser(senderId);
        
        if (!isSenderAdmin && !isOwner) {
            return reply("❌ Only group admins or bot owner can use this command.");
        }

        // Check if the bot is an admin
        if (!isBotAdmin) return reply("❌ I need to be an admin to remove members.");

        // Check if country code is provided
        if (!q || q.trim() === '') {
            return reply(`❌ Please provide a country code.\n\n*Usage:*\n.out <country_code>\n\n*Examples:*\n• .out 92 (Pakistan)\n• .out 91 (India)\n• .out 1 (USA)\n• .out 44 (UK)\n• .out 971 (UAE)`);
        }

        const countryCode = q.trim();
        
        // Validate country code
        if (!/^\d+$/.test(countryCode)) {
            return reply("❌ Invalid country code. Please provide only numbers.\n\n*Example:* .out 92");
        }

        // Show processing
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Get group metadata
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants || [];

        // Find members with the specified country code
        const targets = [];
        const skippedAdmins = [];
        const skippedBot = [];

        for (let participant of participants) {
            const phoneNumber = extractPhoneNumber(participant);
            
            if (phoneNumber && phoneNumber.startsWith(countryCode)) {
                // Skip admins
                if (isParticipantAdmin(participant)) {
                    skippedAdmins.push(participant.id);
                    continue;
                }
                
                // Skip bot itself
                if (isTargetBot(conn, participant.id)) {
                    skippedBot.push(participant.id);
                    continue;
                }
                
                targets.push(participant.id);
            }
        }

        // If no targets found
        if (targets.length === 0) {
            let message = `❌ No removable members found with country code +${countryCode}`;
            
            if (skippedAdmins.length > 0) {
                message += `\n\n⚠️ Skipped ${skippedAdmins.length} admin(s) with this code.`;
            }
            
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(message);
        }

        // Confirmation before removing
        const senderNum = extractDisplayNumber(senderId);

        // Remove members in batches to avoid rate limiting
        const batchSize = 5;
        let removedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < targets.length; i += batchSize) {
            const batch = targets.slice(i, i + batchSize);
            
            try {
                await conn.groupParticipantsUpdate(from, batch, "remove");
                removedCount += batch.length;
            } catch (e) {
                console.error("Error removing batch:", e);
                failedCount += batch.length;
            }
            
            // Add delay between batches to avoid rate limiting
            if (i + batchSize < targets.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        // Success message
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        const resultMessage = `🦶 *Country Code Kick Results*\n\n` +
            `🌍 *Country Code:* +${countryCode}\n` +
            `✅ *Removed:* ${removedCount} member(s)\n` +
            `${failedCount > 0 ? `❌ *Failed:* ${failedCount} member(s)\n` : ''}` +
            `${skippedAdmins.length > 0 ? `⚠️ *Skipped Admins:* ${skippedAdmins.length}\n` : ''}` +
            `\n👤 *Action By:* @${senderNum}\n` +
            `📅 *Time:* ${new Date().toLocaleString()}`;

        await reply(resultMessage, {
            mentions: [senderId]
        });

    } catch (error) {
        console.error("Out command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        
        if (error.message?.includes('429')) {
            reply("❌ Rate limit reached. Please try again in a few seconds.");
        } else if (error.message?.includes('not-authorized')) {
            reply("❌ I don't have permission to remove members.");
        } else {
            reply("❌ Failed to remove members. Error: " + (error.message || 'Unknown error'));
        }
    }
});