const { cmd } = require('../command');
const config = require("../config");
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// 📁 DATABASE FILES
// ═══════════════════════════════════════════════════════════
const antiLinkDbPath = path.join(__dirname, '../database/antilink.json');
const warningsDbPath = path.join(__dirname, '../database/antilink_warnings.json');

// Ensure database exists
function ensureDbExists() {
    const dbDir = path.dirname(antiLinkDbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(antiLinkDbPath)) {
        fs.writeFileSync(antiLinkDbPath, JSON.stringify({}), 'utf8');
    }
    if (!fs.existsSync(warningsDbPath)) {
        fs.writeFileSync(warningsDbPath, JSON.stringify({}), 'utf8');
    }
}

// Load anti-link settings
function loadAntiLinkSettings() {
    try {
        ensureDbExists();
        const data = fs.readFileSync(antiLinkDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Save anti-link settings
function saveAntiLinkSettings(settings) {
    try {
        ensureDbExists();
        fs.writeFileSync(antiLinkDbPath, JSON.stringify(settings, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving antilink settings:', error);
        return false;
    }
}

// Load warnings
function loadWarnings() {
    try {
        ensureDbExists();
        const data = fs.readFileSync(warningsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Save warnings
function saveWarnings(warnings) {
    try {
        ensureDbExists();
        fs.writeFileSync(warningsDbPath, JSON.stringify(warnings, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 🔧 CHECK IF ANTILINK IS ENABLED (WITH CONFIG SUPPORT)
// ═══════════════════════════════════════════════════════════
function isAntiLinkEnabled(groupId) {
    const settings = loadAntiLinkSettings();
    
    // If group has custom setting, use it
    if (settings[groupId] !== undefined) {
        return settings[groupId] === true;
    }
    
    // Otherwise check config.ANTI_LINK (auto-enable if true)
    const configAntiLink = config.ANTI_LINK === 'true' || config.ANTI_LINK === true;
    return configAntiLink;
}

// Set antilink status for specific group
function setAntiLinkStatus(groupId, enabled) {
    const settings = loadAntiLinkSettings();
    settings[groupId] = enabled;
    return saveAntiLinkSettings(settings);
}

// ═══════════════════════════════════════════════════════════
// ⚠️ WARNING SYSTEM (Auto-reset after 5 minutes)
// ═══════════════════════════════════════════════════════════
function getWarningCount(groupId, senderId) {
    const warnings = loadWarnings();
    const key = `${groupId}_${senderId}`;
    
    if (!warnings[key]) return 0;
    
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Auto-reset if more than 5 minutes passed
    if (now - warnings[key].timestamp > fiveMinutes) {
        delete warnings[key];
        saveWarnings(warnings);
        return 0;
    }
    
    return warnings[key].count;
}

function addWarning(groupId, senderId) {
    const warnings = loadWarnings();
    const key = `${groupId}_${senderId}`;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Reset if expired or new user
    if (!warnings[key] || (now - warnings[key].timestamp > fiveMinutes)) {
        warnings[key] = { count: 1, timestamp: now };
    } else {
        warnings[key].count += 1;
        warnings[key].timestamp = now;
    }
    
    saveWarnings(warnings);
    return warnings[key].count;
}

function resetWarning(groupId, senderId) {
    const warnings = loadWarnings();
    const key = `${groupId}_${senderId}`;
    if (warnings[key]) {
        delete warnings[key];
        saveWarnings(warnings);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
function extractNumber(id) {
    if (!id) return '';
    let num = id;
    if (num.includes('@')) num = num.split('@')[0];
    if (num.includes(':')) num = num.split(':')[0];
    return num.replace(/[^0-9]/g, '');
}

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        const botNumber = extractNumber(botId);
        const botLidNumber = extractNumber(botLid);
        const senderNumber = extractNumber(senderId);
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            const pNumber = extractNumber(p.id);
            const pLidNumber = p.lid ? extractNumber(p.lid) : '';
            const pPhoneNumber = p.phoneNumber ? extractNumber(p.phoneNumber) : '';
            const isAdmin = p.admin === "admin" || p.admin === "superadmin";
            
            if (isAdmin) {
                if (pNumber === botNumber || pLidNumber === botNumber || 
                    pNumber === botLidNumber || pLidNumber === botLidNumber ||
                    pPhoneNumber === botNumber) {
                    isBotAdmin = true;
                }
                if (pNumber === senderNumber || pLidNumber === senderNumber ||
                    pPhoneNumber === senderNumber) {
                    isSenderAdmin = true;
                }
            }
        }
        
        return { isBotAdmin, isSenderAdmin };
    } catch (err) {
        console.error('Error checking admin status:', err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

function isOwnerUser(senderId) {
    const senderNumber = extractNumber(senderId);
    if (!config.OWNER_NUMBER) return false;
    const ownerNumber = extractNumber(config.OWNER_NUMBER);
    return senderNumber === ownerNumber;
}

async function getParticipantId(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const senderNumber = extractNumber(senderId);
        
        for (let p of participants) {
            const pNumber = extractNumber(p.id);
            const pLidNumber = p.lid ? extractNumber(p.lid) : '';
            const pPhoneNumber = p.phoneNumber ? extractNumber(p.phoneNumber) : '';
            
            if (pNumber === senderNumber || pLidNumber === senderNumber ||
                pPhoneNumber === senderNumber) {
                return p.id;
            }
        }
        return senderId;
    } catch (err) {
        return senderId;
    }
}

// ═══════════════════════════════════════════════════════════
// 📋 ANTI-LINK COMMAND (Simple On/Off)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "antilink",
    alias: ["al"],
    desc: "Enable or disable anti-link",
    category: "group",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, args, q, isGroup, sender, reply }) => {
    try {
        if (!isGroup) {
            return await conn.sendMessage(from, { 
                text: "❌ This command only works in groups!" 
            }, { quoted: mek });
        }

        const senderId = m.key?.participant || sender;
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        const isOwner = isOwnerUser(senderId);

        if (!isSenderAdmin && !isOwner) {
            return await conn.sendMessage(from, { 
                text: "❌ Only group admins can use this command!" 
            }, { quoted: mek });
        }

        const option = q ? q.toLowerCase().trim() : '';
        const currentStatus = isAntiLinkEnabled(from);
        const configAntiLink = config.ANTI_LINK === 'true' || config.ANTI_LINK === true;

        // No argument - show status
        if (!option) {
            const statusEmoji = currentStatus ? "🟢" : "🔴";
            const statusText = currentStatus ? "Enabled" : "Disabled";
            const configStatus = configAntiLink ? "✅ TRUE" : "❌ FALSE";
            
            return await conn.sendMessage(from, { 
                text: `🔗 *Anti-Link Status:* ${statusEmoji} ${statusText}\n\n⚙️ *Config ANTI_LINK:* ${configStatus}\n\n📝 *Usage:*\n• *.antilink on* - Enable\n• *.antilink off* - Disable\n\n⚠️ *Rules:*\n• 1st link = Warning + Delete\n• 2nd link = Kick from group\n• Warnings reset after 5 minutes`
            }, { quoted: mek });
        }

        // Enable anti-link
        if (option === 'on' || option === 'enable') {
            if (!isBotAdmin) {
                return await conn.sendMessage(from, { 
                    text: "❌ I need to be an admin to use Anti-Link!" 
                }, { quoted: mek });
            }

            setAntiLinkStatus(from, true);

            await conn.sendMessage(from, { 
                react: { text: "✅", key: mek.key } 
            });

            return await conn.sendMessage(from, { 
                text: `✅ *Anti-Link Enabled!*\n\n🔗 WhatsApp group/channel links will be deleted.\n\n⚠️ *Rules:*\n• 1st link = Warning + Delete\n• 2nd link = Kick from group\n• Warnings reset after 5 minutes`
            }, { quoted: mek });
        }

        // Disable anti-link
        if (option === 'off' || option === 'disable') {
            setAntiLinkStatus(from, false);

            await conn.sendMessage(from, { 
                react: { text: "✅", key: mek.key } 
            });

            return await conn.sendMessage(from, { 
                text: `🔴 *Anti-Link Disabled!*\n\n✅ Members can now share links freely.`
            }, { quoted: mek });
        }

        // Unknown option
        return await conn.sendMessage(from, { 
            text: `❌ Unknown option!\n\n📝 *Usage:*\n• *.antilink on* - Enable\n• *.antilink off* - Disable`
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in antilink command:", e);
        await conn.sendMessage(from, { 
            text: `❌ An error occurred: ${e.message}` 
        }, { quoted: mek });
    }
});

// ═══════════════════════════════════════════════════════════
// 🔍 ANTI-LINK DETECTOR (BYPASSES PRIVATE MODE)
// ═══════════════════════════════════════════════════════════
cmd({
    on: "body",
    dontAddCommandList: true,
    fromMe: false,
    onlyGroup: true
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup
}) => {
    try {
        // Only run in groups
        if (!isGroup) return;
        if (!body) return;

        // ⭐ BYPASS PRIVATE MODE CHECK - Always run antilink in groups
        // Check if anti-link is enabled (includes config.ANTI_LINK check)
        if (!isAntiLinkEnabled(from)) return;

        const senderId = m.key?.participant || sender;
        if (!senderId) return;

        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        const isOwner = isOwnerUser(senderId);

        // Skip if sender is admin or owner
        if (isSenderAdmin || isOwner) return;

        // Skip if bot is not admin
        if (!isBotAdmin) return;

        // WhatsApp group & channel links only
        const waLinksRegex = /(chat\.whatsapp\.com\/[A-Za-z0-9]+|whatsapp\.com\/channel\/[A-Za-z0-9]+)/gi;

        if (!waLinksRegex.test(body)) return;

        // Delete the message first
        try {
            await conn.sendMessage(from, { delete: m.key });
        } catch (delError) {
            console.error("Failed to delete message:", delError);
        }

        // Add warning and get count
        const warningCount = addWarning(from, senderId);
        const displayNumber = extractNumber(senderId);

        // ═══════════════════════════════════════════════════════════
        // 🎯 SECOND WARNING = KICK
        // ═══════════════════════════════════════════════════════════
        if (warningCount >= 2) {
            // Get correct participant ID for kick
            const participantId = await getParticipantId(conn, from, senderId);
            
            // Send kick message
            await conn.sendMessage(from, {
                text: `🚨 *KICKED!*\n\n@${displayNumber} sent WhatsApp links *2 times*!\n\n⛔ User has been *REMOVED* from the group.`,
                mentions: [senderId]
            });

            // Kick the user
            try {
                await conn.groupParticipantsUpdate(from, [participantId], "remove");
                console.log(`👢 User kicked for 2nd link violation: ${senderId}`);
                
                // Reset warning after kick
                resetWarning(from, senderId);
            } catch (kickError) {
                console.error("Failed to kick user:", kickError);
                await conn.sendMessage(from, {
                    text: `❌ Failed to remove user. Please remove manually.`
                });
            }
            
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // ⚠️ FIRST WARNING
        // ═══════════════════════════════════════════════════════════
        await conn.sendMessage(from, {
            text: `⚠️ *WARNING ${warningCount}/2*\n\n@${displayNumber}, WhatsApp group/channel links are *not allowed*!\n\n🗑️ Your message has been deleted.\n\n⛔ *Next violation = KICK*\n🕐 Warning resets after 5 minutes.`,
            mentions: [senderId]
        });

    } catch (error) {
        console.error("Anti-link detector error:", error);
    }
});
