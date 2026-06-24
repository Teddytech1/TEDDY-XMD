/**
 * TEDDY-XMD - WhatsApp Bot
 * AutoTyping Command
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

// Path to config file
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

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

// Main command
async function autotypingCommand(sock, chatId, message) {
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
                    text: `🤖 *AUTOTYPING STATUS*\n\nStatus: ${
                        config.enabled ? '✅ Enabled' : '❌ Disabled'
                    }`,
                    contextInfo: channelInfo
                }, { quoted: message });
            } else {
                return await sock.sendMessage(chatId, {
                    text:
`❌ Invalid option!

Usage:
• .autotyping on
• .autotyping off
• .autotyping status`,
                    contextInfo: channelInfo
                }, { quoted: message });
            }
        } else {
            config.enabled = !config.enabled;
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(chatId, {
            text: `✅ AutoTyping has been *${
                config.enabled ? 'Enabled' : 'Disabled'
            }* successfully.`,
            contextInfo: channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('AutoTyping Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to process AutoTyping command.',
            contextInfo: channelInfo
        }, { quoted: message });
    }
}

// Check status
function isAutotypingEnabled() {
    try {
        return initConfig().enabled;
    } catch (err) {
        console.error('Autotyping status error:', err);
        return false;
    }
}

// For normal chat responses
async function handleAutotypingForMessage(sock, chatId, userMessage = '') {
    if (!isAutotypingEnabled()) return false;

    try {
        await sock.presenceSubscribe(chatId);

        await sock.sendPresenceUpdate('composing', chatId);

        const delay = Math.max(
            2000,
            Math.min(7000, userMessage.length * 120)
        );

        await new Promise(resolve => setTimeout(resolve, delay));

        await sock.sendPresenceUpdate('paused', chatId);

        return true;
    } catch (error) {
        console.error('Typing indicator error:', error);
        return false;
    }
}

// Before command execution
async function handleAutotypingForCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;

    try {
        await sock.presenceSubscribe(chatId);

        await sock.sendPresenceUpdate('composing', chatId);

        await new Promise(resolve => setTimeout(resolve, 2500));

        await sock.sendPresenceUpdate('paused', chatId);

        return true;
    } catch (error) {
        console.error('Command typing error:', error);
        return false;
    }
}

// Optional: show typing after response
async function showTypingAfterCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;

    try {
        await sock.sendPresenceUpdate('composing', chatId);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendPresenceUpdate('paused', chatId);

        return true;
    } catch (error) {
        console.error('Post-command typing error:', error);
        return false;
    }
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};