const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
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

async function welcomeCommand(sock, chatId, message) {
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
    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    const enabled = await isWelcomeOn(id);
    if (!enabled) return;

    const customMessage = await getWelcome(id);
    const metadata = await sock.groupMetadata(id);

    const groupName = metadata.subject;
    const groupDesc = metadata.desc || 'No group description available';

    for (const participant of participants) {
        try {
            const userJid =
                typeof participant === 'string'
                    ? participant
                    : participant.id || participant.toString();

            const number = userJid.split('@')[0];

            let profilePic =
                'https://files.catbox.moe/5ffdce.jpeg';

            try {
                profilePic = await sock.profilePictureUrl(
                    userJid,
                    'image'
                );
            } catch {}

            const totalMembers = metadata.participants.length;

            let caption;

            if (customMessage) {
                caption = customMessage
                    .replace(/{user}/g, `@${number}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc);
            } else {
                caption = `
╭━━━〔 👋 *WELCOME* 〕━━━⬣
┃
┃ ✦ User : @${number}
┃ ✦ Group : ${groupName}
┃ ✦ Members : ${totalMembers}
┃
┣━━━〔 📜 GROUP INFO 〕━━━⬣
┃ ${groupDesc}
┃
╰━━━━━━━━━━━━━━━━━━⬣

> Welcome to *${groupName}* 🎉
> Please read the group rules and enjoy your stay.

*Powered by TEDDY-XMD 🚀*
`;
            }

            try {
                const apiUrl =
                    `https://api.popcat.xyz/welcomecard?background=https://files.catbox.moe/5ffdce.jpeg` +
                    `&text1=${encodeURIComponent(number)}` +
                    `&text2=Welcome+To+${encodeURIComponent(groupName)}` +
                    `&text3=Member+${totalMembers}` +
                    `&avatar=${encodeURIComponent(profilePic)}`;

                const response = await fetch(apiUrl);

                if (response.ok) {
                    const image = await response.buffer();

                    await sock.sendMessage(
                        id,
                        {
                            image,
                            caption,
                            mentions: [userJid],
                            ...channelInfo
                        }
                    );

                    continue;
                }
            } catch (e) {
                console.log('Welcome image failed:', e.message);
            }

            // fallback text
            await sock.sendMessage(
                id,
                {
                    text: caption,
                    mentions: [userJid],
                    ...channelInfo
                }
            );
        } catch (err) {
            console.error('Welcome Error:', err);

            const userJid =
                typeof participant === 'string'
                    ? participant
                    : participant.id || participant.toString();

            await sock.sendMessage(
                id,
                {
                    text: `👋 Welcome @${userJid.split('@')[0]} to *${groupName}*`,
                    mentions: [userJid],
                    ...channelInfo
                }
            );
        }
    }
}

module.exports = {
    welcomeCommand,
    handleJoinEvent
};