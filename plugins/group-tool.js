const { cmd } = require('../command');

// Function to check if sender is the Bot Owner (who deployed the bot)
function isBotOwner(conn, senderId) {
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    
    const botNumber = botId.includes(':') 
        ? botId.split(':')[0] 
        : (botId.includes('@') ? botId.split('@')[0] : botId);
    
    const botLidNumeric = botLid.includes(':') 
        ? botLid.split(':')[0] 
        : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
    
    let senderNumber = senderId;
    if (senderId.includes(':')) {
        senderNumber = senderId.split(':')[0];
    } else if (senderId.includes('@')) {
        senderNumber = senderId.split('@')[0];
    }
    
    return (
        senderNumber === botNumber ||
        senderNumber === botLidNumeric ||
        senderId === botId ||
        senderId === botLid
    );
}

// Function to check if bot is admin
async function checkBotAdmin(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.includes(':') 
            ? botId.split(':')[0] 
            : (botId.includes('@') ? botId.split('@')[0] : botId);
        
        const botLidNumeric = botLid.includes(':') 
            ? botLid.split(':')[0] 
            : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';
                
                const botMatches = (
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumeric === pLidNumeric ||
                    botNumber === pPhoneNumber ||
                    botNumber === pId
                );
                
                if (botMatches) return true;
            }
        }
        return false;
    } catch (err) {
        return false;
    }
}

// Function to get all kickable members
async function getKickableMembers(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.includes(':') 
            ? botId.split(':')[0] 
            : (botId.includes('@') ? botId.split('@')[0] : botId);
        
        const botLidNumeric = botLid.includes(':') 
            ? botLid.split(':')[0] 
            : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        
        const kickable = [];
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                continue;
            }
            
            const pId = p.id ? p.id.split('@')[0] : '';
            const pLid = p.lid ? p.lid.split('@')[0] : '';
            const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
            const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
            const pFullId = p.id || '';
            const pFullLid = p.lid || '';
            
            const isBot = (
                botId === pFullId ||
                botId === pFullLid ||
                botLid === pFullLid ||
                botLidNumeric === pLidNumeric ||
                botNumber === pPhoneNumber ||
                botNumber === pId
            );
            
            if (!isBot && p.id) {
                kickable.push(p.id);
            }
        }
        
        return kickable;
    } catch (err) {
        return [];
    }
}

cmd({
    pattern: "kickall",
    alias: ["removeall", "cleargroup"],
    desc: "Remove all members at once (Bot Owner Only)",
    category: "owner",
    react: "⚠️",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        if (!citel.isGroup) {
            return citel.reply("❌ This command works only in groups!");
        }
        
        const senderId = citel.key?.participant || citel.sender || citel.key?.remoteJid;
        if (!senderId) {
            return citel.reply("❌ Could not identify sender.");
        }
        
        // Only Bot Owner can use
        if (!isBotOwner(Void, senderId)) {
            return citel.reply(`❌ *ACCESS DENIED!*\n\n⚠️ Only *Bot Owner* can use this command!`);
        }
        
        const botIsAdmin = await checkBotAdmin(Void, citel.chat);
        if (!botIsAdmin) {
            return citel.reply("❌ I need to be an *admin* to kick members!");
        }
        
        const members = await getKickableMembers(Void, citel.chat);
        
        if (members.length === 0) {
            return citel.reply("❌ No members found to kick!");
        }
        
        // 🚀 KICK ALL MEMBERS AT ONCE - Single Action!
        await Void.groupParticipantsUpdate(citel.chat, members, "remove");
        
        // Success message
        await citel.reply(`✅ *DONE!*\n\n🗑️ Kicked *${members.length}* members at once!`);
        
    } catch (error) {
        console.error("[KICKALL ERROR]", error);
        citel.reply("❌ *Error!* " + error.message);
    }
});
