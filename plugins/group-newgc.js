
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');

// Function to check if user is owner/creator with LID support
function isOwnerUser(senderId) {
    // Extract sender number from various formats
    const senderNumber = senderId.includes(':') 
        ? senderId.split(':')[0] 
        : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
    
    // Get owner numbers from config
    const ownerNumbers = [];
    
    // Add OWNER_NUMBER from config
    if (config.OWNER_NUMBER) {
        const ownerNum = config.OWNER_NUMBER.includes('@') 
            ? config.OWNER_NUMBER.split('@')[0] 
            : config.OWNER_NUMBER;
        ownerNumbers.push(ownerNum.includes(':') ? ownerNum.split(':')[0] : ownerNum);
    }
    
    // Add DEV from config
    if (config.DEV) {
        const devNum = config.DEV.includes('@') 
            ? config.DEV.split('@')[0] 
            : config.DEV;
        ownerNumbers.push(devNum.includes(':') ? devNum.split(':')[0] : devNum);
    }
    
    // Add SUDO users from config if exists
    if (config.SUDO) {
        const sudoList = config.SUDO.split(',').map(num => {
            const cleaned = num.trim();
            const extracted = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
            return extracted.includes(':') ? extracted.split(':')[0] : extracted;
        });
        ownerNumbers.push(...sudoList);
    }
    
    // Filter out empty values
    const validOwnerNumbers = ownerNumbers.filter(Boolean);
    
    // Check if sender matches any owner number
    return validOwnerNumbers.some(ownerNum => {
        return senderNumber === ownerNum || 
               senderNumber === ownerNum.replace(/[^0-9]/g, '');
    });
}

// Function to check if sender is the bot itself
function isBotUser(conn, senderId) {
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    
    const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
    
    const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
    
    return (
        botId === senderId ||
        botLid === senderId ||
        botNumber === senderNumber ||
        botLidNumeric === senderNumber
    );
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

// Function to format JID properly for group creation
function formatJidForGroup(number) {
    // Remove any non-numeric characters except + at start
    let cleaned = number.replace(/[^0-9+]/g, '');
    
    // Remove + if present
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    // Add @s.whatsapp.net suffix
    if (!cleaned.includes('@')) {
        cleaned = cleaned + '@s.whatsapp.net';
    }
    
    return cleaned;
}

cmd({
    pattern: "newgc",
    alias: ["creategc", "creategroup", "newgroup", "makegc"],
    react: "🆕",
    desc: "Create a new WhatsApp group",
    category: "owner",
    use: ".newgc <group name> | <participant1>, <participant2>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check if sender is owner or bot itself
        const isOwner = isOwnerUser(senderId);
        const isBot = isBotUser(conn, senderId);
        
        if (!isOwner && !isBot) {
            return reply("❌ This command can only be used by the bot owner!");
        }

        // Check if input is provided
        if (!q || q.trim() === '') {
            return reply(`❌ Please provide group name and participants!\n\n*Usage:*\n.newgc My Group Name\n.newgc My Group Name | 923001234567, 923009876543\n\n*Examples:*\n• .newgc Friends Group\n• .newgc Study Group | 923001234567\n• .newgc Work Team | 923001234567, 923002345678`);
        }

        // Parse input - check if participants are provided
        let groupName;
        let participantNumbers = [];

        if (q.includes('|')) {
            // Format: group name | participant1, participant2
            const parts = q.split('|');
            groupName = parts[0].trim();
            
            if (parts[1]) {
                const participantsStr = parts[1].trim();
                participantNumbers = participantsStr.split(',').map(num => num.trim()).filter(num => num.length > 0);
            }
        } else {
            // Just group name, no participants
            groupName = q.trim();
        }

        // Validate group name
        if (!groupName || groupName.length === 0) {
            return reply("❌ Please provide a valid group name!");
        }

        if (groupName.length > 25) {
            return reply(`❌ Group name is too long!\n\n*Maximum:* 25 characters\n*Your text:* ${groupName.length} characters`);
        }

        // Show processing
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Prepare participants list
        let participants = [];

        // Add the sender to the group
        participants.push(senderId);

        // Add provided participants
        for (let num of participantNumbers) {
            const formattedJid = formatJidForGroup(num);
            if (formattedJid && !participants.includes(formattedJid)) {
                participants.push(formattedJid);
            }
        }

        // Remove duplicates
        participants = [...new Set(participants)];

        // Create the group
        const createResult = await conn.groupCreate(groupName, participants);

        if (!createResult || !createResult.id) {
            throw new Error("Failed to create group - no group ID returned");
        }

        const groupId = createResult.id;

        // Wait a bit for group to be created
        await sleep(1000);

        // Try to get invite link
        let inviteLink = '';
        try {
            const inviteCode = await conn.groupInviteCode(groupId);
            inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        } catch (e) {
            console.log("Could not get invite link:", e.message);
            inviteLink = 'Could not generate invite link';
        }

        // Get sender number for display
        const senderNum = extractDisplayNumber(senderId);

        // Success message
        const successMessage = `✅ *Group Created Successfully!*\n\n` +
            `📛 *Group Name:* ${groupName}\n` +
            `🆔 *Group ID:* ${groupId}\n` +
            `👥 *Members Added:* ${participants.length}\n` +
            `🔗 *Invite Link:*\n${inviteLink}\n\n` +
            `👤 *Created By:* @${senderNum}\n` +
            `📅 *Time:* ${new Date().toLocaleString()}`;

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        await reply(successMessage, {
            mentions: [senderId]
        });

        // Send welcome message to the new group
        try {
            const welcomeMsg = `🎉 *Welcome to ${groupName}!*\n\n` +
                `This group was created by @${senderNum} using ${config.BOT_NAME || 'Bot'}.\n\n` +
                `📅 Created: ${new Date().toLocaleString()}`;

            await conn.sendMessage(groupId, {
                text: welcomeMsg,
                mentions: [senderId]
            });
        } catch (e) {
            console.log("Could not send welcome message:", e.message);
        }

    } catch (e) {
        console.error("Error creating group:", e);
        
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        
        if (e.message?.includes('not-authorized')) {
            reply("❌ I'm not authorized to create groups!");
        } else if (e.message?.includes('429')) {
            reply("❌ Rate limit reached. Please try again in a few seconds.");
        } else if (e.message?.includes('invalid')) {
            reply("❌ Invalid participant number(s). Please check the numbers and try again.");
        } else {
            reply(`❌ Failed to create group.\n\nError: ${e.message || 'Unknown error'}`);
        }
    }
});