const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;
    if (!m.mentionedJid || m.mentionedJid.length === 0) return;

    // Add your Catbox video URLs here (10-15 videos)
    const videoClips = [
      "https://files.catbox.moe/video1.mp4",
      "https://files.catbox.moe/video2.mp4",
      "https://files.catbox.moe/video3.mp4",
      "https://files.catbox.moe/video4.mp4",
      "https://files.catbox.moe/video5.mp4",
      "https://files.catbox.moe/video6.mp4",
      "https://files.catbox.moe/video7.mp4",
      "https://files.catbox.moe/video8.mp4",
      "https://files.catbox.moe/video9.mp4",
      "https://files.catbox.moe/video10.mp4",
      "https://files.catbox.moe/video11.mp4",
      "https://files.catbox.moe/video12.mp4",
      "https://files.catbox.moe/video13.mp4",
      "https://files.catbox.moe/video14.mp4",
      "https://files.catbox.moe/video15.mp4"
    ];

    const randomClip = videoClips[Math.floor(Math.random() * videoClips.length)];
    const botNumber = conn.user.id.split(":")[0] + '@s.whatsapp.net';

    if (m.mentionedJid.includes(botNumber)) {
      
      // Send as Video Note (Camera Note - Round Circle Video)
      await conn.sendMessage(m.chat, {
        video: { url: randomClip },
        ptv: true,  // This makes it a VIDEO NOTE (round circle like WhatsApp camera)
        gifPlayback: false
      }, { quoted: m });
      
    }
  } catch (e) {
    console.error(e);
    const ownerJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    await conn.sendMessage(ownerJid, {
      text: `*Bot Error in Mention Handler:*\n${e.message}`
    });
  }
});
