const { cmd } = require("../command");

// Safety Configuration
const SAFETY = {
  MAX_JIDS: 20,
  BASE_DELAY: 2000,
  EXTRA_DELAY: 4000,
};

// Helper function to get message content
async function getMessageContent(message) {
  try {
    const mtype = message.quoted.mtype;
    let messageContent = {};

    // Media messages (image, video, audio, sticker, document)
    if (["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"].includes(mtype)) {
      const buffer = await message.quoted.download();

      switch (mtype) {
        case "imageMessage":
          messageContent = {
            image: buffer,
            caption: message.quoted.text || '',
            mimetype: message.quoted.mimetype || "image/jpeg"
          };
          break;
        case "videoMessage":
          messageContent = {
            video: buffer,
            caption: message.quoted.text || '',
            mimetype: message.quoted.mimetype || "video/mp4"
          };
          break;
        case "audioMessage":
          messageContent = {
            audio: buffer,
            mimetype: message.quoted.mimetype || "audio/mp4",
            ptt: message.quoted.ptt || false
          };
          break;
        case "stickerMessage":
          messageContent = {
            sticker: buffer,
            mimetype: message.quoted.mimetype || "image/webp"
          };
          break;
        case "documentMessage":
          messageContent = {
            document: buffer,
            mimetype: message.quoted.mimetype || "application/octet-stream",
            fileName: message.quoted.fileName || "document"
          };
          break;
      }
    }
    // Text messages (including links)
    else if (mtype === "extendedTextMessage" || mtype === "conversation") {
      messageContent = {
        text: message.quoted.text || message.quoted.body || ""
      };
    }
    else {
      return null;
    }

    return messageContent;
  } catch (error) {
    console.error("getMessageContent Error:", error);
    return null;
  }
}

// ============ COMMAND 1: Forward to Specific Number(s) ============
cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Forward message to specific number(s)",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isOwner }) => {
  try {
    if (!isOwner) return await message.reply("*📛 Owner Only Command*");

    // Get input text
    let inputText = "";
    if (typeof match === "string") {
      inputText = match.trim();
    } else if (Array.isArray(match)) {
      inputText = match.join(" ").trim();
    } else if (match && typeof match === "object") {
      inputText = match.text || "";
    }

    // Show usage if empty
    if (!inputText || inputText === "") {
      return await message.reply(
        `*📌 Forward Command*\n\n` +
        `*Usage:*\n` +
        `Reply to any message and type:\n\n` +
        `➤ .forward 254799963583\n` +
        `➤ .fwd 254799963583,254747963583\n` +
        `➤ .fwd 254747963583 254799963583\n\n` +
        `*Supports:* Text, Image, Video, Audio, Document, Sticker, Links`
      );
    }

    // Check quoted message
    if (!message.quoted) {
      return await message.reply("*🍁 Please reply to a message to forward*");
    }

    // Extract numbers
    const rawNumbers = inputText.split(/[\s,]+/).filter(num => num.trim().length > 0);

    // Process numbers to JIDs
    const validJids = rawNumbers
      .map(num => {
        num = num.trim().replace(/[^0-9]/g, ''); // Remove non-numeric characters
        if (num.length >= 10 && num.length <= 15) {
          return `${num}@s.whatsapp.net`;
        }
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return await message.reply(
        `❌ No valid numbers found!\n\n` +
        `*Example:*\n` +
        `.fwd 923001234567`
      );
    }

    // Get message content
    const messageContent = await getMessageContent(message);
    if (!messageContent) {
      return await message.reply("❌ Unsupported message type!");
    }

    // Send to all numbers
    let successCount = 0;
    const failedNumbers = [];

    for (const jid of validJids) {
      try {
        await client.sendMessage(jid, messageContent);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, SAFETY.BASE_DELAY));
      } catch (error) {
        failedNumbers.push(jid.split('@')[0]);
      }
    }

    // Send report
    let report = `✅ *Forward Complete*\n\n📤 Sent: ${successCount}/${validJids.length}`;
    if (failedNumbers.length > 0) {
      report += `\n❌ Failed: ${failedNumbers.join(', ')}`;
    }
    await message.reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await message.reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});

// ============ COMMAND 2: Forward to All Groups ============
cmd({
  pattern: "forwardall",
  alias: ["fwdall"],
  desc: "Forward message to all groups",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isOwner }) => {
  try {
    if (!isOwner) return await message.reply("*📛 Owner Only Command*");

    // Show usage if no quoted message
    if (!message.quoted) {
      return await message.reply(
        `*📌 Forward All Command*\n\n` +
        `*Usage:*\n` +
        `Reply to any message and type:\n\n` +
        `➤ .forwardall\n` +
        `➤ .fwdall\n\n` +
        `*This will send to ALL your groups!*\n\n` +
        `*Supports:* Text, Image, Video, Audio, Document, Sticker, Links`
      );
    }

    // Fetch all groups
    await message.reply("🔄 Fetching all groups...");
    
    const groups = await client.groupFetchAllParticipating();
    const groupJids = Object.keys(groups);

    if (groupJids.length === 0) {
      return await message.reply("❌ No groups found!");
    }

    await message.reply(`📢 Starting forward to ${groupJids.length} groups...`);

    // Get message content
    const messageContent = await getMessageContent(message);
    if (!messageContent) {
      return await message.reply("❌ Unsupported message type!");
    }

    // Send to all groups
    let successCount = 0;
    const failedGroups = [];

    for (const [index, jid] of groupJids.entries()) {
      try {
        await client.sendMessage(jid, messageContent);
        successCount++;

        // Progress update every 10 groups
        if ((index + 1) % 10 === 0) {
          await message.reply(`🔄 Progress: ${index + 1}/${groupJids.length} groups...`);
        }

        // Delay to avoid ban
        const delayTime = (index + 1) % 10 === 0 ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY;
        await new Promise(resolve => setTimeout(resolve, delayTime));

      } catch (error) {
        failedGroups.push(groups[jid]?.subject || jid.replace('@g.us', ''));
        await new Promise(resolve => setTimeout(resolve, SAFETY.BASE_DELAY));
      }
    }

    // Final report
    let report = `✅ *Forward All Complete*\n\n` +
      `📤 Success: ${successCount}/${groupJids.length} groups\n` +
      `📦 Content: ${message.quoted.mtype?.replace('Message', '') || 'text'}`;

    if (failedGroups.length > 0) {
      report += `\n\n❌ Failed (${failedGroups.length}):`;
      report += `\n${failedGroups.slice(0, 5).join('\n')}`;
      if (failedGroups.length > 5) {
        report += `\n... +${failedGroups.length - 5} more`;
      }
    }

    await message.reply(report);

  } catch (error) {
    console.error("ForwardAll Error:", error);
    await message.reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});

// ============ COMMAND 3: Forward to Specific Groups by JID ============
cmd({
  pattern: "fwdgroup",
  alias: ["forwardgroup", "fwdg"],
  desc: "Forward message to specific groups by JID",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isOwner }) => {
  try {
    if (!isOwner) return await message.reply("*📛 Owner Only Command*");

    // Get input
    let inputText = "";
    if (typeof match === "string") {
      inputText = match.trim();
    } else if (Array.isArray(match)) {
      inputText = match.join(" ").trim();
    } else if (match && typeof match === "object") {
      inputText = match.text || "";
    }

    // Show usage
    if (!inputText || inputText === "") {
      return await message.reply(
        `*📌 Forward to Groups*\n\n` +
        `*Usage:*\n` +
        `Reply to any message and type:\n\n` +
        `➤ .fwdgroup 120363411055564@g.us\n` +
        `➤ .fwdg 120363411055564@g.us,120363339399@g.us\n\n` +
        `*Supports:* Text, Image, Video, Audio, Document, Sticker, Links`
      );
    }

    if (!message.quoted) {
      return await message.reply("*🍁 Please reply to a message to forward*");
    }

    // Extract JIDs
    const rawJids = inputText.split(/[\s,]+/).filter(jid => jid.trim().length > 0);

    // Process JIDs
    const validJids = rawJids
      .map(jid => {
        const cleanJid = jid.replace(/@g\.us$/i, "").replace(/[^0-9]/g, '');
        return cleanJid.length > 0 ? `${cleanJid}@g.us` : null;
      })
      .filter(jid => jid !== null)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return await message.reply(
        `❌ No valid group JIDs found!\n\n` +
        `*Example:*\n` +
        `.fwdg 120363411055564@g.us`
      );
    }

    // Get message content
    const messageContent = await getMessageContent(message);
    if (!messageContent) {
      return await message.reply("❌ Unsupported message type!");
    }

    // Send to groups
    let successCount = 0;
    const failedJids = [];

    for (const [index, jid] of validJids.entries()) {
      try {
        await client.sendMessage(jid, messageContent);
        successCount++;

        if ((index + 1) % 10 === 0) {
          await message.reply(`🔄 Progress: ${index + 1}/${validJids.length}...`);
        }

        const delayTime = (index + 1) % 10 === 0 ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY;
        await new Promise(resolve => setTimeout(resolve, delayTime));

      } catch (error) {
        failedJids.push(jid.replace('@g.us', ''));
      }
    }

    // Report
    let report = `✅ *Forward Complete*\n\n📤 Sent: ${successCount}/${validJids.length} groups`;
    if (failedJids.length > 0) {
      report += `\n❌ Failed: ${failedJids.length} groups`;
    }
    await message.reply(report);

  } catch (error) {
    console.error("FwdGroup Error:", error);
    await message.reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
