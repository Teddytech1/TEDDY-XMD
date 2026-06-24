const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const isOwnerOrSudo = require('../lib/isOwner');

async function setProfilePicture(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Owner only command!*'
            });
        }

        const quoted =
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Reply to an image, sticker, GIF or video with *.setpp*'
            });
        }

        const media =
            quoted.imageMessage ||
            quoted.stickerMessage ||
            quoted.videoMessage;

        if (!media) {
            return await sock.sendMessage(chatId, {
                text: '❌ Reply to an image, sticker, GIF or video.'
            });
        }

        const mediaType = quoted.imageMessage
            ? 'image'
            : quoted.stickerMessage
            ? 'sticker'
            : 'video';

        // Download media
        const stream = await downloadContentFromMessage(media, mediaType);

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (!buffer.length) {
            return await sock.sendMessage(chatId, {
                text: '❌ Failed to download media.'
            });
        }

        // Temporary directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir))
            fs.mkdirSync(tmpDir, { recursive: true });

        // Images can be used directly
        if (quoted.imageMessage) {
            await sock.updateProfilePicture(sock.user.id, buffer);

        } else {
            // Convert sticker/video/gif to jpg
            const input = path.join(tmpDir, `input_${Date.now()}`);
            const output = path.join(tmpDir, `output_${Date.now()}.jpg`);

            fs.writeFileSync(input, buffer);

            await new Promise((resolve, reject) => {
                exec(
                    `ffmpeg -y -i "${input}" -vf "scale=640:640:force_original_aspect_ratio=decrease,pad=640:640:(ow-iw)/2:(oh-ih)/2:white" -frames:v 1 "${output}"`,
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });

            const imgBuffer = fs.readFileSync(output);

            await sock.updateProfilePicture(
                sock.user.id,
                imgBuffer
            );

            try {
                fs.unlinkSync(input);
                fs.unlinkSync(output);
            } catch {}
        }

        await sock.sendMessage(chatId, {
            text:
`╭━━━〔 ✅ SUCCESS 〕━━━⬣
┃ Profile picture updated successfully.
╰━━━━━━━━━━━━━━━━━━⬣

> *TEDDY-XMD 🚀*`,
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

    } catch (err) {
        console.error('SETPP ERROR:', err);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to update profile picture.'
        });
    }
}

module.exports = setProfilePicture;