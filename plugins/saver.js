const { cmd } = require("../command");

cmd({
  pattern: "save",
  alias: ["sv", "saveit", "aeff", "vo"],
  desc: "Save any message to your inbox (including view once)",
  category: "utility",
  filename: __filename
}, async (client, message, match, { sender }) => {
  try {
    // Check if message is quoted
    if (!message.quoted) {
      return await message.reply(
        `*📌 Save Command*\n\n` +
        `*Usage:*\n` +
        `Reply to any message and type:\n\n` +
        `➤ .save\n` +
        `➤ .sv\n` +
        `➤ .viewonce\n\n` +
        `*Supports:*\n` +
        `✅ View Once Photos/Videos\n` +
        `✅ Photos & Videos\n` +
        `✅ Voice Notes & Audio\n` +
        `✅ Documents & Stickers\n` +
        `✅ Text, Links & Numbers`
      );
    }

    // Get the quoted message
    const quotedMsg = message.quoted;
    let mtype = quotedMsg.mtype;
    let mediaMsg = quotedMsg;
    let isViewOnce = false;

    // ===== Handle View Once Messages ===== //
    if (mtype === "viewOnceMessage" || mtype === "viewOnceMessageV2" || mtype === "viewOnceMessageV2Extension") {
      isViewOnce = true;
      
      // Extract the actual message from view once wrapper
      const viewOnceContent = quotedMsg.message?.viewOnceMessage?.message ||
                              quotedMsg.message?.viewOnceMessageV2?.message ||
                              quotedMsg.message?.viewOnceMessageV2Extension?.message ||
                              quotedMsg.message;
      
      if (viewOnceContent?.imageMessage) {
        mtype = "imageMessage";
        mediaMsg = { ...quotedMsg, message: { imageMessage: viewOnceContent.imageMessage } };
      } else if (viewOnceContent?.videoMessage) {
        mtype = "videoMessage";
        mediaMsg = { ...quotedMsg, message: { videoMessage: viewOnceContent.videoMessage } };
      } else if (viewOnceContent?.audioMessage) {
        mtype = "audioMessage";
        mediaMsg = { ...quotedMsg, message: { audioMessage: viewOnceContent.audioMessage } };
      }
    }

    // Get sender's private chat JID
    const userJid = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;
    
    let messageContent = {};
    let savedType = "";

    // ===== Image Message ===== //
    if (mtype === "imageMessage") {
      const buffer = await quotedMsg.download();
      messageContent = {
        image: buffer,
        caption: `${isViewOnce ? '👁️ *View Once Saved*\n\n' : '📸 *Image Saved*\n\n'}` +
                 `${quotedMsg.text || quotedMsg.message?.imageMessage?.caption || ''}`
      };
      savedType = isViewOnce ? "View Once Photo" : "Photo";
    }
    
    // ===== Video Message ===== //
    else if (mtype === "videoMessage") {
      const buffer = await quotedMsg.download();
      messageContent = {
        video: buffer,
        caption: `${isViewOnce ? '👁️ *View Once Saved*\n\n' : '🎥 *Video Saved*\n\n'}` +
                 `${quotedMsg.text || quotedMsg.message?.videoMessage?.caption || ''}`
      };
      savedType = isViewOnce ? "View Once Video" : "Video";
    }
    
    // ===== Audio/Voice Message ===== //
    else if (mtype === "audioMessage") {
      const buffer = await quotedMsg.download();
      const isPtt = quotedMsg.message?.audioMessage?.ptt || 
                    quotedMsg.ptt || 
                    false;
      
      messageContent = {
        audio: buffer,
        mimetype: quotedMsg.mimetype || "audio/mp4",
        ptt: isPtt
      };
      savedType = isPtt ? "Voice Note" : "Audio";
    }
    
    // ===== Sticker Message ===== //
    else if (mtype === "stickerMessage") {
      const buffer = await quotedMsg.download();
      messageContent = {
        sticker: buffer
      };
      savedType = "Sticker";
    }
    
    // ===== Document Message ===== //
    else if (mtype === "documentMessage") {
      const buffer = await quotedMsg.download();
      messageContent = {
        document: buffer,
        mimetype: quotedMsg.mimetype || "application/octet-stream",
        fileName: quotedMsg.fileName || quotedMsg.message?.documentMessage?.fileName || "document"
      };
      savedType = "Document";
    }
    
    // ===== Text Messages (including links, numbers) ===== //
    else if (mtype === "extendedTextMessage" || mtype === "conversation") {
      const textContent = quotedMsg.text || 
                         quotedMsg.body || 
                         quotedMsg.message?.conversation ||
                         quotedMsg.message?.extendedTextMessage?.text || 
                         "";
      
      if (!textContent) {
        return await message.reply("❌ No text content found!");
      }
      
      messageContent = {
        text: `📝 *Text Saved*\n\n${textContent}`
      };
      savedType = "Text";
    }
    
    // ===== Contact Message ===== //
    else if (mtype === "contactMessage" || mtype === "contactsArrayMessage") {
      const vcard = quotedMsg.message?.contactMessage?.vcard ||
                   quotedMsg.message?.contactsArrayMessage?.contacts?.[0]?.vcard || "";
      
      // Extract phone number from vcard
      const phoneMatch = vcard.match(/TEL[^:]*:([+\d]+)/i);
      const phone = phoneMatch ? phoneMatch[1] : "Unknown";
      
      // Extract name from vcard
      const nameMatch = vcard.match(/FN:(.+)/i);
      const name = nameMatch ? nameMatch[1] : "Unknown";
      
      messageContent = {
        text: `📱 *Contact Saved*\n\n👤 Name: ${name}\n📞 Number: ${phone}`
      };
      savedType = "Contact";
    }
    
    // ===== Location Message ===== //
    else if (mtype === "locationMessage" || mtype === "liveLocationMessage") {
      const lat = quotedMsg.message?.locationMessage?.degreesLatitude ||
                 quotedMsg.message?.liveLocationMessage?.degreesLatitude;
      const long = quotedMsg.message?.locationMessage?.degreesLongitude ||
                  quotedMsg.message?.liveLocationMessage?.degreesLongitude;
      
      messageContent = {
        text: `📍 *Location Saved*\n\n` +
              `Latitude: ${lat}\n` +
              `Longitude: ${long}\n\n` +
              `🗺️ Google Maps:\nhttps://maps.google.com/?q=${lat},${long}`
      };
      savedType = "Location";
    }
    
    // ===== Unsupported Type ===== //
    else {
      return await message.reply(
        `❌ Unsupported message type: ${mtype}\n\n` +
        `Please try with:\n` +
        `• Photos/Videos\n` +
        `• Voice Notes/Audio\n` +
        `• Documents\n` +
        `• Text Messages\n` +
        `• View Once Media`
      );
    }

    // Send to user's inbox
    await client.sendMessage(userJid, messageContent);
    
    // Confirm save
    await message.reply(
      `✅ *Saved Successfully!*\n\n` +
      `📦 Type: ${savedType}\n` +
      `📥 Sent to: Your Inbox\n` +
      `${isViewOnce ? '\n👁️ View Once media recovered!' : ''}`
    );

  } catch (error) {
    console.error("Save Error:", error);
    await message.reply(
      `💢 Error: ${error.message.substring(0, 100)}\n\n` +
      `Try again or check if the media is still available.`
    );
  }
})
