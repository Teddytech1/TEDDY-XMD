const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const webp = require('node-webpmux');
const crypto = require('crypto');

async function stickercropCommand(sock, chatId, message) {
    const messageToQuote = message;
    let targetMessage = message;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedInfo = message.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mediaMessage = targetMessage.message?.imageMessage ||
                         targetMessage.message?.videoMessage ||
                         targetMessage.message?.documentMessage ||
                         targetMessage.message?.stickerMessage;

    if (!mediaMessage) {
        await sock.sendMessage(chatId, {
            text: 'Please reply to an image/video/sticker with .crop, or send an image/video/sticker with .crop as the caption.',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421104812135@newsletter',
                    newsletterName: 'TEDDY-XMD',
                    serverMessageId: -1
                }
            }
        }, { quoted: messageToQuote });
        return;
    }

    try {
        const mediaBuffer = await downloadMediaMessage(
            targetMessage,
            'buffer',
            {},
            {
                logger: undefined,
                reuploadRequest: sock.updateMediaMessage
            }
        );

        if (!mediaBuffer) {
            await sock.sendMessage(chatId, {
                text: 'Failed to download media. Please try again.',
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421104812135@newsletter',
                        newsletterName: 'TEDDY-XMD',
                        serverMessageId: -1
                    }
                }
            });
            return;
        }

        // ... keep all your existing ffmpeg code unchanged ...

        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': settings.packname || 'TEDDY-XMD',
            'emojis': ['✂️']
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00,
            0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57,
            0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00,
            0x00, 0x00
        ]);

        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        const finalBuffer = await img.save(null);

        await sock.sendMessage(chatId, {
            sticker: finalBuffer
        }, { quoted: messageToQuote });

    } catch (error) {
        console.error('Error in stickercrop command:', error);

        await sock.sendMessage(chatId, {
            text: 'Failed to crop sticker! Try with an image.',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421104812135@newsletter',
                    newsletterName: 'TEDDY-XMD',
                    serverMessageId: -1
                }
            }
        });
    }
}

// Helper function
async function stickercropFromBuffer(inputBuffer, isAnimated) {
    // Keep your existing code unchanged...

    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': settings.packname || 'TEDDY-XMD',
        'emojis': ['✂️']
    };

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00,
        0x00, 0x00
    ]);

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;

    const finalBuffer = await img.save(null);
    return finalBuffer;
}

module.exports = stickercropCommand;
module.exports.stickercropFromBuffer = stickercropFromBuffer;