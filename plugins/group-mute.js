const config = require('../config')
const { cmd } = require('../command')

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        // Normalize bot ID - extract numeric part
        const botNumber = botId.replace(/[:@].*/g, '');
        const botLidNumber = botLid ? botLid.replace(/[:@].*/g, '') : '';
        
        // Normalize sender ID - extract numeric part
        const senderNumber = senderId.replace(/[:@].*/g, '');
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            const isAdmin = p.admin === "admin" || p.admin === "superadmin";
            
            if (isAdmin) {
                // Normalize participant ID
                const pNumber = p.id ? p.id.replace(/[:@].*/g, '') : '';
                const pLidNumber = p.lid ? p.lid.replace(/[:@].*/g, '') : '';
                
                // Check if this participant is the bot
                if (pNumber === botNumber || 
                    pLidNumber === botNumber || 
                    pNumber === botLidNumber || 
                    pLidNumber === botLidNumber) {
                    isBotAdmin = true;
                }
                
                // Check if this participant is the sender
                if (pNumber === senderNumber || 
                    pLidNumber === senderNumber) {
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
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, reply, sender }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        
        // ✅ FIXED: Properly get sender ID with correct operator precedence
        let senderId;
        
        if (mek.key.fromMe) {
            // If message is from bot itself
            senderId = conn.user?.id;
        } else {
            // Get actual sender from group message
            senderId = mek.key.participant || m?.sender || sender || m?.key?.participant;
        }
        
        if (!senderId) {
            return reply("❌ Could not identify sender.");
        }
        
        console.log('Sender ID:', senderId); // Debug log
        
        // Check admin status using the integrated function
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        
        console.log('Bot Admin:', isBotAdmin, '| Sender Admin:', isSenderAdmin); // Debug log
        
        if (!isSenderAdmin) {
            return reply("❌ Only group admins can use this command.");
        }
        
        if (!isBotAdmin) {
            return reply("❌ I need to be an admin to mute the group.");
        }
        
        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ Group has been muted. Only admins can send messages.");
        
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});
