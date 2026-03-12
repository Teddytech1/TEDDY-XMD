const { cmd } = require("../command");

const triggerWords = ["beautiful", "cute", "oh", "🙂", "nice", "ok", "❤️", "😘", "❤", "😍", "🔥", "👀", "wow", "👍"];

cmd({
  on: "body",
  dontAddCommandList: true,
  filename: __filename
}, async (client, message, match, { from, body, isCreator }) => {
  try {
    // Check if message is a trigger word
    if (!triggerWords.includes(body?.toLowerCase?.() || body)) return;
    
    // Only owner can use
    if (!isCreator) return;
    
    // Must be replying to a message
    if (!match.quoted) return;
    
    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    let messageContent = {};
    
    if (mtype === "imageMessage") {
      messageContent = {
        image: buffer,
        caption: match.quoted.text || '',
        mimetype: "image/jpeg"
      };
    } else if (mtype === "videoMessage") {
      messageContent = {
        video: buffer,
        caption: match.quoted.text || '',
        mimetype: "video/mp4"
      };
    } else if (mtype === "audioMessage") {
      messageContent = {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: match.quoted.ptt || false
      };
    } else {
      return;
    }

    // Send to owner's inbox
    await client.sendMessage(message.sender, messageContent, { quoted: message });
    
  } catch (error) {
    console.error("VV Error:", error);
  }
});
