const { cmd } = require("../command");
const fs = require("fs");

cmd({
  pattern: "bio",
  alias: ["bio", "postbio"],
  desc: "Post text, photo, or video to WhatsApp status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { isCreator }) => {
  if (!isCreator) return await message.reply("📛 *Owner-only command!*");

  const quoted = message.quoted || message;

  try {
    // 📝 Text-only status
    if (quoted.text && !quoted.hasMedia) {
      await client.sendMessage("status@broadcast", {
        text: quoted.text
      });
      return await message.reply("✅ Text  posted successfully!");
    }

    // 🎥 Photo or Video status
    if (quoted.hasMedia) {
      const media = await quoted.download();
      const caption = quoted.caption || "";

      // Detect media type
      let type = "image";
      if (quoted.msg && quoted.msg.mimetype) {
        const mime = quoted.msg.mimetype;
        if (mime.includes("video")) type = "video";
        else if (mime.includes("image")) type = "image";
      }

      // Send to status
      await client.sendMessage("status@broadcast", {
        [type]: media,
        caption: caption
      });

      return await message.reply(`✅ ${type === "video" ? "Video" : "Image"} status posted successfully!`);
    }

    // ⚠ No text or media detected
    return await message.reply("⚠️ Please reply to some text, image, or video to post it to status.");

  } catch (error) {
    console.error("❌ Status error:", error);
    return await message.reply(`❌ Failed to post status.\n\nError: ${error.message}`);
  }
});
