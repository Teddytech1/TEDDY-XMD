
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

// Function to check if target is an admin (to verify before demoting)
async function isTargetAdmin(conn, chatId, targetId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const targetNumber = targetId.includes(':') ? targetId.split(':')[0] : (targetId.includes('@') ? targetId.split('@')[0] : targetId);
        const targetIdWithoutSuffix = targetId.includes('@') ? targetId.split('@')[0] : targetId;
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
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
                    return { isAdmin: true, isSuperAdmin: p.admin === "superadmin" };
                }
            }
        }
        return { isAdmin: false, isSuperAdmin: false };
    } catch (err) {
        console.error('❌ Error checking target admin status:', err);
        return { isAdmin: false, isSuperAdmin: false };
    }
}

cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demote group admin to normal member",
    category: "admin",
    react: "⬇️",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, isGroup, sender, reply }) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        // Get sender ID with LID support
        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
        if (!senderId) return reply("❌ Could not identify sender.");

        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);

        if (!isSenderAdmin) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmin) return reply("❌ I need to be an admin to demote users.");

        let userToDemote = [];
        
        // Check for mentioned users
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            userToDemote = m.mentionedJid;
        }
        // Check for replied message
        else if (quoted && quoted.sender) {
            userToDemote = [quoted.sender];
        }
        // Check if user provided number in command
        else if (q && q.includes('@')) {
            userToDemote = [q.replace(/[@\s]/g, '') + '@s.whatsapp.net'];
        }
        // Check for plain number
        else if (q && /^\d+$/.test(q.trim())) {
            userToDemote = [q.trim() + '@s.whatsapp.net'];
        }
        
        // If no user found through any method
        if (userToDemote.length === 0) {
            return reply("❌ Please mention the user, reply to their message, or provide a number to demote!\n\n*Example:*\n• .demote @user\n• .demote 923001234567\n• Reply to message with .demote");
        }

        // Prevent demoting the bot itself
        for (let target of userToDemote) {
            if (isTargetBot(conn, target)) {
                return reply("❌ I cannot demote myself!");
            }
        }

        // Check if target(s) are actually admins and not superadmins
        let validTargets = [];
        let invalidTargets = [];
        let superAdminTargets = [];

        for (let target of userToDemote) {
            const { isAdmin, isSuperAdmin } = await isTargetAdmin(conn, from, target);
            
            if (isSuperAdmin) {
                superAdminTargets.push(target);
            } else if (isAdmin) {
                validTargets.push(target);
            } else {
                invalidTargets.push(target);
            }
        }

        // If trying to demote superadmin (group owner)
        if (superAdminTargets.length > 0) {
            const superAdminNames = superAdminTargets.map(jid => {
                const num = jid.includes(':') ? jid.split(':')[0] : (jid.includes('@') ? jid.split('@')[0] : jid);
                return `@${num}`;
            });
            return reply(`❌ Cannot demote group owner(s):\n${superAdminNames.join('\n')}`, {
                mentions: superAdminTargets
            });
        }

        // If no valid targets
        if (validTargets.length === 0) {
            if (invalidTargets.length > 0) {
                const invalidNames = invalidTargets.map(jid => {
                    const num = jid.includes(':') ? jid.split(':')[0] : (jid.includes('@') ? jid.split('@')[0] : jid);
                    return `@${num}`;
                });
                return reply(`❌ The following user(s) are not admins:\n${invalidNames.join('\n')}`, {
                    mentions: invalidTargets
                });
            }
            return reply("❌ No valid admin found to demote!");
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Demote the user(s)
        await conn.groupParticipantsUpdate(from, validTargets, "demote");
        
        // Get usernames for each demoted user
        const usernames = validTargets.map(jid => {
            const num = jid.includes(':') ? jid.split(':')[0] : (jid.includes('@') ? jid.split('@')[0] : jid);
            return `@${num}`;
        });

        // Get sender number for display
        const senderNum = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotionMessage = `*『 GROUP DEMOTION 』*\n\n` +
            `👤 *Demoted User${validTargets.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `   • ${name}`).join('\n')}\n\n` +
            `👑 *Demoted By:* @${senderNum}\n\n` +
            `📅 *Date:* ${new Date().toLocaleString()}`;
        
        await reply(demotionMessage, { 
            mentions: [...validTargets, senderId]
        });

    } catch (error) {
        console.error("Demote command error:", error);
        
        if (error.message?.includes('429') || error.data === 429) {
            await reply("❌ Rate limit reached. Please try again in a few seconds.");
        } else if (error.message?.includes('not-authorized')) {
            await reply("❌ I don't have permission to demote this user. They might be a higher admin.");
        } else {
            await reply("❌ Failed to demote user(s). Please make sure the user is an admin and try again.");
        }
    }
});