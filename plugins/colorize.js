const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "colorize",
  alias: ["color", "restore"],
  desc: "Colorize a grayscale image using AI",
  category: "image-tools",
  use: ".colorize <image_url>",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  const imageUrl = args.join(" ");
  if (!imageUrl) {
    return reply("🎨 Please provide an image URL to colorize.\n\nExample: *.colorize https://example.com/oldphoto.jpg*");
  }

  try {
    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/tools/colorize?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

    // Convert to WebP buffer
    const buffer = Buffer.from(response.data, 'binary');

    await conn.sendMessage(mek.chat, {
      image: buffer,
      caption: `🖼️ *Colorized Image*\n\n> Restored by *TEDDY-XMD AI Colorizer*`
    }, { quoted: mek });

  } catch (error) {
    console.error("❌ Error colorizing image:", error.message);
    reply("❌ *Failed to connect to API.* Please try again later.");
  }
});
