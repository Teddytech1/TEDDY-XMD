/**
 * TEDDY-XMD - WhatsApp Bot
 * AutoRead Command
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// Channel Info
const channelInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363421104812135@newsletter',
        newsletterName: 'TEDDY-XMD',
        serverMessageId: -1
    }
};

// Config file path
const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

// Initialize config
function initConfig() {
    try {
        const dir = path.dirname(configPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(
                configPath,
                JSON.stringify({ enabled: false }, null, 2)
            );
        }

        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error('Config initialization error:', err);
        return { enabled: false };
    }
}

// Command handler
async function autoreadCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe && !isOwner) {
            return await sock.sendMessage(chatId, {
                text: '❌ Only the bot owner can use this command.',
                contextInfo: channelInfo
            }, { quoted: message });
        }

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const args = text.trim().split(/\s+/).slice(1);

        const config = initConfig();

        if (args.length > 0) {
            const option = args[0].toLowerCase();

            if (['on', 'enable'].includes(option)) {
                config.enabled = true;
            } else if (['off', 'disable'].includes(option)) {
                config.enabled = false;
            } else if (option === 'status') {
                return await sock.sendMessage(chatId, {
                    text: `📖 *AUTOREAD STATUS*\n\nStatus: ${
                        config.enabled ? '✅ Enabled' : '❌ Disabled'
                    }`,
                    contextInfo: channelInfo
                }, { quoted: message });
            } else {
                return await sock.sendMessage(chatId, {
                    text:
`❌ Invalid option!

Usage:
• .autoread on
• .autoread off
• .autoread status`,
                    contextInfo: channelInfo
                }, { quoted: message });
            }
        } else {
            config.enabled = !config.enabled;
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(chatId, {
            text: `✅ AutoRead has been *${
                config.enabled ? 'Enabled' : 'Disabled'
            }* successfully.`,
            contextInfo: channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('AutoRead command error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to process AutoRead command.',
            contextInfo: channelInfo
        }, { quoted: message });
    }
}

// Check if autoread is enabled
function isAutoreadEnabled() {
    try {
        return initConfig().enabled;
    } catch (error) {
        console.error('AutoRead status error:', error);
        return false;
    }
}

// Check if bot was mentioned
function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;

    const messageTypes = [
        'extendedTextMessage',
        'imageMessage',
        'videoMessage',
        'stickerMessage',
        'documentMessage',
        'audioMessage',
        'contactMessage',
        'locationMessage'
    ];

    // Check explicit mentions
    for (const type of messageTypes) {
        const mentioned =
            message.message[type]?.contextInfo?.mentionedJid || [];

        if (mentioned.includes(botNumber)) {
            return true;
        }
    }

    // Check text mentions
    const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        '';

    if (text) {
        const botUser = botNumber.split('@')[0];

        if (text.includes(`@${botUser}`)) {
            return true;
        }

        const names = [
            global.botname?.toLowerCase(),
            'bot',
            'teddy-xmd',
            'teddy'
        ].filter(Boolean);

        const lowerText = text.toLowerCase();

        if (names.some(name => lowerText.includes(name))) {
            return true;
        }
    }

    return false;
}

// Main autoread handler
async function handleAutoread(sock, message) {
    if (!isAutoreadEnabled()) return false;

    try {
        const botNumber =
            sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const mentioned = isBotMentionedInMessage(
            message,
            botNumber
        );

        // Don't mark mentions as read
        if (mentioned) return false;

        const key = {
            remoteJid: message.key.remoteJid,
            id: message.key.id,
            participant: message.key.participant
        };

        await sock.readMessages([key]);

        return true;
    } catch (error) {
        console.error('AutoRead handler error:', error);
        return false;
    }
}

module.exports = {
    autoreadCommand,
    isAutoreadEnabled,
    isBotMentionedInMessage,
    handleAutoread
};