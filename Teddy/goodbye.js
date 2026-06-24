const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const fetch = require('node-fetch');

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363421104812135@newsletter',
            newsletterName: 'TEDDY-XMD',
            serverMessageId: -1
        }
    }
};

async function goodbyeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, {
            text: '❌ This command can only be used in groups.'
        });
    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        '';

    const matchText = text.split(' ').slice(1).join(' ');
    await handleGoodbye(sock, chatId, message, matchText);
}

async function handleLeaveEvent(sock, id, participants) {
    const enabled = await isGoodByeOn(id);
    if (!enabled) return;

    const customMessage = await getGoodbye(id);

    let metadata;
    try {
        metadata = await sock.groupMetadata(id);
    } catch {
        return;
    }

    const groupName = metadata.subject || 'Unknown Group';

    for (const participant of participants) {
        try {
            const userJid =
                typeof participant === 'string'
                    ? participant
                    : participant.id || participant.toString();

            const username = userJid.split('@')[0];

            let finalMessage;

            if (customMessage) {
                finalMessage = customMessage
                    .replace(/{user}/g, `@${username}`)
                    .replace(/{group}/g, groupName);
            } else {
                finalMessage = `
╭━━━〔 👋 MEMBER LEFT 〕━━━⬣
┃ 🚪 User: @${username}
┃ 👥 Members: ${metadata.participants.length}
┃ 🏠 Group: ${groupName}
╰━━━━━━━━━━━━━━━━━━⬣

💔 Goodbye *@${username}*

We wish you all the best.

> Powered By TEDDY-XMD
`;
            }

            let pfp =
                'https://files.catbox.moe/5ffdce.jpeg';

            try {
                pfp = await sock.profilePictureUrl(userJid, 'image');
            } catch {}

            try {
                const api = `https://api.popcat.xyz/welcomecard?background=https://files.catbox.moe/5ffdce.jpeg&text1=${encodeURIComponent(username)}&text2=Goodbye!&text3=Members: ${metadata.participants.length}&avatar=${encodeURIComponent(pfp)}`;

                const res = await fetch(api);

                if (res.ok) {
                    const buffer = await res.buffer();

                    await sock.sendMessage(id, {
                        image: buffer,
                        caption: finalMessage,
                        mentions: [userJid],
                        ...channelInfo
                    });

                    continue;
                }
            } catch (err) {
                console.log('Image generation failed:', err.message);
            }

            await sock.sendMessage(id, {
                text: finalMessage,
                mentions: [userJid],
                ...channelInfo
            });

        } catch (err) {
            console.error('Goodbye Error:', err);

            const userJid =
                typeof participant === 'string'
                    ? participant
                    : participant.id || participant.toString();

            await sock.sendMessage(id, {
                text: `👋 Goodbye @${userJid.split('@')[0]}`,
                mentions: [userJid],
                ...channelInfo
            });
        }
    }
}

module.exports = {
    goodbyeCommand,
    handleLeaveEvent
};