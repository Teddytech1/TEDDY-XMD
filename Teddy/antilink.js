const fs = require('fs').promises;
const path = require('path');

// Enhanced URL detection patterns
const linkPatterns = {
    whatsappGroup: /(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/(?:invite\/)?[A-Za-z0-9]{20,}/i,
    whatsappChannel: /(?:https?:\/\/)?(?:www\.)?wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
    whatsappContact: /(?:https?:\/\/)?(?:www\.)?wa\.me\/[0-9]{8,}/i,
    telegram: /(?:https?:\/\/)?(?:www\.)?t\.me\/(?!joinchat\/)[A-Za-z0-9_]{5,32}/i,
    telegramGroup: /(?:https?:\/\/)?(?:www\.)?t\.me\/joinchat\/[A-Za-z0-9_-]{10,}/i,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv|stories)\/[A-Za-z0-9_-]{5,}/i,
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:[A-Za-z0-9.]{5,}\/(?:posts|photos|videos)\/\d+|groups\/[A-Za-z0-9.]{5,})/i,
    tiktok: /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:@[A-Za-z0-9._]+\/video\/\d+|[A-Za-z0-9]+\/video\/\d+|t\/[A-Za-z0-9]{9})/i,
    youtube: /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|shorts\/|playlist\?list=)[A-Za-z0-9_-]{10,}/i,
    youtubeShort: /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[A-Za-z0-9_-]{10,}/i,
    twitter: /(?:https?:\/\/)?(?:www\.|mobile\.)?twitter\.com\/[A-Za-z0-9_]+\/status\/\d+/i,
    x: /(?:https?:\/\/)?(?:www\.)?x\.com\/[A-Za-z0-9_]+\/status\/\d+/i,
    discord: /(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/[A-Za-z0-9]{5,}/i,
    snapchat: /(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/[A-Za-z0-9._-]{3,}/i,
    reddit: /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/[A-Za-z0-9_]+\/comments\/[A-Za-z0-9_]+\/[A-Za-z0-9_]+/i,
    pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.(?:com|pin)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/i,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|post|pulse)\/[A-Za-z0-9._-]+/i,
    spotify: /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:track|album|playlist|artist)\/[A-Za-z0-9]{20,}/i,
    allDomains: /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi,
    ipAddress: /(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:\/[^\s]*)?/gi
};

// Antilink configuration with enhanced features
const antilinkConfig = {
    filePath: path.join(__dirname, '../lib/antilink.json'),
    
    async load() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('Creating new antilink configuration...');
            return {};
        }
    },
    
    async save(data) {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving antilink config:', error);
            return false;
        }
    },
    
    async getGroupConfig(chatId) {
        const data = await this.load();
        return data[chatId] || null;
    },
    
    async setGroupConfig(chatId, config) {
        const data = await this.load();
        data[chatId] = {
            enabled: config.enabled || true,
            action: config.action || 'warn',
            mode: config.mode || 'strict', // strict, medium, custom
            warnings: config.warnings || {},
            exemptDomains: config.exemptDomains || [],
            exemptUsers: config.exemptUsers || [],
            lastAction: config.lastAction || null,
            stats: config.stats || { deleted: 0, warned: 0, kicked: 0 },
            settings: config.settings || {
                deleteMessage: true,
                notifyAdmin: true,
                allowMediaLinks: false,
                allowImageLinks: false,
                allowVideoLinks: false,
                allowTextLinks: false
            }
        };
        return await this.save(data);
    },
    
    async updateStats(chatId, statType) {
        const data = await this.load();
        if (data[chatId] && data[chatId].stats) {
            data[chatId].stats[statType] = (data[chatId].stats[statType] || 0) + 1;
            return await this.save(data);
        }
        return false;
    },
    
    async addWarning(chatId, userId) {
        const data = await this.load();
        if (!data[chatId]) return 0;
        
        if (!data[chatId].warnings) data[chatId].warnings = {};
        if (!data[chatId].warnings[userId]) {
            data[chatId].warnings[userId] = 1;
        } else {
            data[chatId].warnings[userId] += 1;
        }
        
        await this.save(data);
        return data[chatId].warnings[userId];
    },
    
    async clearWarning(chatId, userId) {
        const data = await this.load();
        if (data[chatId] && data[chatId].warnings && data[chatId].warnings[userId]) {
            delete data[chatId].warnings[userId];
            return await this.save(data);
        }
        return false;
    },
    
    async resetGroup(chatId) {
        const data = await this.load();
        if (data[chatId]) {
            delete data[chatId];
            return await this.save(data);
        }
        return true;
    },
    
    async addExemptDomain(chatId, domain) {
        const data = await this.load();
        if (data[chatId]) {
            if (!data[chatId].exemptDomains) data[chatId].exemptDomains = [];
            if (!data[chatId].exemptDomains.includes(domain)) {
                data[chatId].exemptDomains.push(domain);
                return await this.save(data);
            }
        }
        return false;
    },
    
    async removeExemptDomain(chatId, domain) {
        const data = await this.load();
        if (data[chatId] && data[chatId].exemptDomains) {
            data[chatId].exemptDomains = data[chatId].exemptDomains.filter(d => d !== domain);
            return await this.save(data);
        }
        return false;
    }
};

// Enhanced URL detection function
function detectLinks(text, mode = 'strict') {
    if (!text || typeof text !== 'string') return { hasLinks: false, links: [] };
    
    const detectedLinks = [];
    
    // Check all patterns
    for (const [type, pattern] of Object.entries(linkPatterns)) {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                detectedLinks.push({
                    type,
                    url: match,
                    domain: extractDomain(match)
                });
            });
        }
    }
    
    // Additional checks based on mode
    if (mode === 'strict') {
        // Check for obfuscated URLs
        const obfuscated = text.match(/(?:[a-z0-9]+[\.\-_])+[a-z]{2,}/gi);
        if (obfuscated) {
            obfuscated.forEach(match => {
                if (!detectedLinks.some(link => link.url.includes(match))) {
                    detectedLinks.push({
                        type: 'obfuscated',
                        url: match,
                        domain: extractDomain(match)
                    });
                }
            });
        }
    }
    
    return {
        hasLinks: detectedLinks.length > 0,
        links: detectedLinks,
        count: detectedLinks.length
    };
}

function extractDomain(url) {
    try {
        url = url.replace(/^(https?:\/\/)?(www\.)?/, '');
        const domain = url.split('/')[0];
        return domain.split('?')[0];
    } catch {
        return url;
    }
}

function isExemptDomain(domain, exemptList) {
    if (!exemptList || !Array.isArray(exemptList)) return false;
    
    return exemptList.some(exempt => {
        if (exempt.includes('*')) {
            const regex = new RegExp(exempt.replace(/\*/g, '.*').replace(/\./g, '\\.'), 'i');
            return regex.test(domain);
        }
        return domain === exempt || domain.endsWith('.' + exempt);
    });
}

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { 
                text: '🚫 *Admin Only Command!*\nOnly group admins can configure antilink settings.'
            }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(prefix.length).trim().split(' ');
        const command = args[0]?.toLowerCase();
        const subCommand = args[1]?.toLowerCase();
        const param = args[2]?.toLowerCase();

        if (!command || command !== 'antilink') return;

        const config = await antilinkConfig.getGroupConfig(chatId);
        
        switch (subCommand) {
            case 'on':
                if (config?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '✅ *Antilink is already enabled!*\nUse `.antilink status` to check current settings.'
                    }, { quoted: message });
                    return;
                }
                
                const success = await antilinkConfig.setGroupConfig(chatId, {
                    enabled: true,
                    action: param || 'warn',
                    mode: 'strict'
                });
                
                await sock.sendMessage(chatId, {
                    text: success ? 
                        `✅ *Antilink Activated!*\n\n• Status: 🔴 ENABLED\n• Action: ${param || 'warn'}\n• Mode: Strict\n\nAll links will now be monitored.` :
                        '❌ Failed to enable antilink. Please try again.'
                }, { quoted: message });
                break;
                
            case 'off':
                if (!config) {
                    await sock.sendMessage(chatId, {
                        text: 'ℹ️ *Antilink is not enabled* in this group.'
                    }, { quoted: message });
                    return;
                }
                
                await antilinkConfig.resetGroup(chatId);
                await sock.sendMessage(chatId, {
                    text: '✅ *Antilink Disabled!*\n\nLinks are now allowed in this group.'
                }, { quoted: message });
                break;
                
            case 'action':
                if (!config || !config.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Antilink is not enabled!*\nEnable it first with `.antilink on`'
                    }, { quoted: message });
                    return;
                }
                
                if (!param || !['delete', 'kick', 'warn'].includes(param)) {
                    await sock.sendMessage(chatId, {
                        text: '📝 *Available Actions:*\n\n• `delete` - Delete message only\n• `warn` - Warn user (3 warnings = kick)\n• `kick` - Kick immediately'
                    }, { quoted: message });
                    return;
                }
                
                config.action = param;
                await antilinkConfig.setGroupConfig(chatId, config);
                
                await sock.sendMessage(chatId, {
                    text: `✅ *Action Updated!*\n\nAntilink action set to: *${param.toUpperCase()}*`
                }, { quoted: message });
                break;
                
            case 'mode':
                if (!config || !config.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Antilink is not enabled!*'
                    }, { quoted: message });
                    return;
                }
                
                const modes = ['strict', 'medium', 'custom'];
                if (!param || !modes.includes(param)) {
                    await sock.sendMessage(chatId, {
                        text: '📊 *Available Modes:*\n\n• `strict` - Block all links\n• `medium` - Block only social media\n• `custom` - Custom configuration'
                    }, { quoted: message });
                    return;
                }
                
                config.mode = param;
                await antilinkConfig.setGroupConfig(chatId, config);
                
                await sock.sendMessage(chatId, {
                    text: `✅ *Mode Updated!*\n\nAntilink mode set to: *${param.toUpperCase()}*`
                }, { quoted: message });
                break;
                
            case 'exempt':
                if (!config || !config.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Antilink is not enabled!*'
                    }, { quoted: message });
                    return;
                }
                
                if (param === 'add' && args[3]) {
                    const domain = args[3].toLowerCase();
                    await antilinkConfig.addExemptDomain(chatId, domain);
                    
                    await sock.sendMessage(chatId, {
                        text: `✅ *Domain Whitelisted!*\n\n${domain} is now exempt from antilink rules.`
                    }, { quoted: message });
                } else if (param === 'remove' && args[3]) {
                    const domain = args[3].toLowerCase();
                    await antilinkConfig.removeExemptDomain(chatId, domain);
                    
                    await sock.sendMessage(chatId, {
                        text: `✅ *Domain Removed!*\n\n${domain} is no longer exempt.`
                    }, { quoted: message });
                } else if (param === 'list') {
                    const exemptList = config.exemptDomains || [];
                    await sock.sendMessage(chatId, {
                        text: exemptList.length > 0 ?
                            `📋 *Whitelisted Domains:*\n\n${exemptList.map(d => `• ${d}`).join('\n')}` :
                            '📭 No domains are whitelisted.'
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        text: '📝 *Exempt Commands:*\n\n• `.antilink exempt add domain.com`\n• `.antilink exempt remove domain.com`\n• `.antilink exempt list`'
                    }, { quoted: message });
                }
                break;
                
            case 'stats':
                if (!config) {
                    await sock.sendMessage(chatId, {
                        text: '📊 *No antilink data available* for this group.'
                    }, { quoted: message });
                    return;
                }
                
                const stats = config.stats || {};
                await sock.sendMessage(chatId, {
                    text: `📊 *Antilink Statistics*\n\n` +
                          `• Messages Deleted: ${stats.deleted || 0}\n` +
                          `• Warnings Given: ${stats.warned || 0}\n` +
                          `• Users Kicked: ${stats.kicked || 0}\n` +
                          `• Active Warnings: ${Object.keys(config.warnings || {}).length}\n` +
                          `• Mode: ${config.mode || 'strict'}\n` +
                          `• Action: ${config.action || 'warn'}`
                }, { quoted: message });
                break;
                
            case 'status':
                if (!config) {
                    await sock.sendMessage(chatId, {
                        text: '🔓 *Antilink Status: DISABLED*\n\nUse `.antilink on` to enable protection.'
                    }, { quoted: message });
                    return;
                }
                
                await sock.sendMessage(chatId, {
                    text: `🔒 *Antilink Status*\n\n` +
                          `• Status: ${config.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}\n` +
                          `• Action: ${config.action || 'warn'}\n` +
                          `• Mode: ${config.mode || 'strict'}\n` +
                          `• Exempt Domains: ${(config.exemptDomains || []).length}\n` +
                          `• Active Warnings: ${Object.keys(config.warnings || {}).length}`
                }, { quoted: message });
                break;
                
            case 'clear':
                if (!config) {
                    await sock.sendMessage(chatId, {
                        text: '❌ No antilink configuration found.'
                    }, { quoted: message });
                    return;
                }
                
                if (param === 'warnings') {
                    config.warnings = {};
                    await antilinkConfig.setGroupConfig(chatId, config);
                    
                    await sock.sendMessage(chatId, {
                        text: '✅ *All warnings cleared!*'
                    }, { quoted: message });
                } else if (param === 'stats') {
                    config.stats = { deleted: 0, warned: 0, kicked: 0 };
                    await antilinkConfig.setGroupConfig(chatId, config);
                    
                    await sock.sendMessage(chatId, {
                        text: '✅ *Statistics reset!*'
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        text: '🧹 *Clear Commands:*\n\n• `.antilink clear warnings`\n• `.antilink clear stats`'
                    }, { quoted: message });
                }
                break;
                
            default:
                const helpText = `🔒 *TEDDY-XMD ANTILINK SYSTEM*\n\n` +
                               `*Commands:*\n` +
                               `• .antilink on [action] - Enable protection\n` +
                               `• .antilink off - Disable protection\n` +
                               `• .antilink action <delete|kick|warn> - Set action\n` +
                               `• .antilink mode <strict|medium|custom> - Set mode\n` +
                               `• .antilink status - Check status\n` +
                               `• .antilink stats - View statistics\n` +
                               `• .antilink exempt <add|remove|list> - Manage whitelist\n` +
                               `• .antilink clear <warnings|stats> - Clear data\n\n` +
                               `*Actions:*\n` +
                               `• delete - Delete message\n` +
                               `• warn - Warn user (3 warnings = kick)\n` +
                               `• kick - Kick immediately\n\n` +
                               `*Modes:*\n` +
                               `• strict - Block all links\n` +
                               `• medium - Block social media only\n` +
                               `• custom - Custom configuration`;
                
                await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Error processing command!*\nPlease try again.'
        });
    }
}

async function handleLinkDetection(sock, mek) {
    try {
        const from = mek.key.remoteJid;
        const sender = mek.key.participant || from;
        
        // Check if it's a group
        if (!from.endsWith('@g.us')) return;
        
        // Get group configuration
        const config = await antilinkConfig.getGroupConfig(from);
        if (!config || !config.enabled) return;
        
        // Extract text from message
        const text = mek.message?.conversation || 
                     mek.message?.extendedTextMessage?.text || 
                     mek.message?.imageMessage?.caption ||
                     mek.message?.videoMessage?.caption ||
                     '';
        
        // Check if user is exempt (admin, bot, or whitelisted)
        const groupMetadata = await sock.groupMetadata(from);
        const groupAdmins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
        
        const isAdmin = groupAdmins.includes(sender);
        const isBot = mek.key.fromMe;
        const creatorNumber = '120363406146813524@s.whatsapp.net';
        const isCreator = sender === creatorNumber;
        
        if (isAdmin || isBot || isCreator || (config.exemptUsers || []).includes(sender)) {
            return;
        }
        
        // Detect links
        const linkDetection = detectLinks(text, config.mode);
        if (!linkDetection.hasLinks) return;
        
        // Check for exempt domains
        const hasNonExemptLinks = linkDetection.links.some(link => 
            !isExemptDomain(link.domain, config.exemptDomains)
        );
        
        if (!hasNonExemptLinks) return;
        
        // Take action based on configuration
        await antilinkConfig.updateStats(from, 'deleted');
        
        switch (config.action) {
            case 'delete':
                // Delete the message
                try {
                    await sock.sendMessage(from, { delete: mek.key });
                } catch (error) {
                    console.error('Failed to delete message:', error);
                }
                
                // Notify user
                await sock.sendMessage(from, {
                    text: `⚠️ *LINK DETECTED!*\n\n` +
                          `@${sender.split('@')[0]}, your message was deleted because it contains links.\n` +
                          `Links are not allowed in this group.`,
                    mentions: [sender]
                });
                break;
                
            case 'kick':
                // Delete message first
                try {
                    await sock.sendMessage(from, { delete: mek.key });
                } catch (error) {
                    console.error('Failed to delete message:', error);
                }
                
                // Kick user
                await sock.groupParticipantsUpdate(from, [sender], "remove");
                await antilinkConfig.updateStats(from, 'kicked');
                
                // Notify group
                await sock.sendMessage(from, {
                    text: `🚫 *USER KICKED!*\n\n` +
                          `@${sender.split('@')[0]} has been removed from the group.\n` +
                          `Reason: Sending links (Antilink violation)`,
                    mentions: [sender]
                });
                break;
                
            case 'warn':
                // Delete message
                try {
                    await sock.sendMessage(from, { delete: mek.key });
                } catch (error) {
                    console.error('Failed to delete message:', error);
                }
                
                // Add warning
                const warningCount = await antilinkConfig.addWarning(from, sender);
                await antilinkConfig.updateStats(from, 'warned');
                
                if (warningCount >= 4) {
                    // Kick after 4 warnings
                    await sock.groupParticipantsUpdate(from, [sender], "remove");
                    await antilinkConfig.updateStats(from, 'kicked');
                    await antilinkConfig.clearWarning(from, sender);
                    
                    await sock.sendMessage(from, {
                        text: `🚨 *FINAL WARNING!*\n\n` +
                              `@${sender.split('@')[0]} has been removed from the group.\n` +
                              `Reason: Received ${warningCount} warnings for sending links`,
                        mentions: [sender]
                    });
                } else {
                    // Warn user
                    await sock.sendMessage(from, {
                        text: `⚠️ *WARNING ${warningCount}/3*\n\n` +
                              `@${sender.split('@')[0]}, links are not allowed in this group!\n` +
                              `Your message has been deleted.\n` +
                              `Next violation will result in ${warningCount === 3 ? 'KICK' : 'warning ' + (warningCount + 1)}`,
                        mentions: [sender]
                    });
                }
                break;
        }
        
        // Log the action
        console.log(`🔗 Antilink action taken in ${from}: ${config.action} for ${sender}`);
        
    } catch (error) {
        console.error('Error in link detection:', error);
    }
}

// Function to initialize antilink event handler
function initAntilinkHandler(HansTechInc) {
    HansTechInc.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;
            
            // Handle ephemeral messages
            mek.message = mek.message.ephemeralMessage?.message || mek.message;
            if (mek.message.protocolMessage) return;
            
            await handleLinkDetection(HansTechInc, mek);
        } catch (error) {
            console.error('Error in antilink handler:', error);
        }
    });
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
    initAntilinkHandler,
    antilinkConfig,
    detectLinks
};
