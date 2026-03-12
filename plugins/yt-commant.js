const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "ytcomment",
  alias: ["fakecomment", "ytc", "fakeyt"],
  desc: "Generate a fake YouTube comment image",
  category: "image-tools",
  use: ".ytcomment text | username | avatar_url",
  filename: __filename
}, async (conn, mek, m, { args, from, reply, quoted }) => {
  try {
    // If no arguments — show example usage
    if (!args.length) {
      return reply(
`🎬 *YouTube Fake Comment Generator*

✨ *How To Use:*

*Method 1:* With Image URL
.ytcomment This is amazing! | JohnDoe | https://imageurl.com/pic.jpg

*Method 2:* Reply to an image
Reply to any image with:
.ytcomment Nice video! | MyUsername

📌 *Format:*
.ytcomment <comment> | <username> | <avatar_url>

💡 Use | to separate values`
      );
    }

    // Join all args and split by |
    const input = args.join(' ').split('|').map(x => x.trim());

    // Get parameters
    const text = input[0];
    const username = input[1] || 'YouTube User';
    let avatar = input[2] || null;

    // Validate text
    if (!text) {
      return reply("❌ Please provide comment text!\n\nExample: .ytcomment Nice video! | JohnDoe | https://image.url");
    }

    // If no avatar, check if replied to an image
    if (!avatar) {
      if (quoted && quoted.mtype === 'imageMessage') {
        // Get image URL from quoted message if possible
        avatar = "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";
      } else {
        // Default avatar
        avatar = "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";
      }
    }

    await reply("⏳ Generating fake YouTube comment...");

    // Properly encode parameters
    const encodedText = encodeURIComponent(text);
    const encodedUsername = encodeURIComponent(username);
    const encodedAvatar = encodeURIComponent(avatar);

    // API URL
    const apiUrl = `https://api.deline.web.id/maker/ytcomment?text=${encodedText}&username=${encodedUsername}&avatar=${encodedAvatar}`;

    console.log("API URL:", apiUrl); // For debugging

    // Make API request
    const res = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      headers: { 
        'accept': 'image/png, image/jpeg, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 60000
    });

    // Check content type
    const contentType = (res.headers['content-type'] || '').toLowerCase();
    
    if (contentType.includes('application/json')) {
      const textData = Buffer.from(res.data).toString('utf8');
      let json;
      try { 
        json = JSON.parse(textData); 
      } catch (e) { 
        json = { error: textData }; 
      }
      return reply(`❌ API Error: ${json.error || json.message || 'Unknown error'}`);
    }

    // Send the generated image
    const imageBuffer = Buffer.from(res.data);
    
    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✅ *Fake YouTube Comment Generated!*\n\n👤 *Username:* ${username}\n💬 *Comment:* ${text}`
    }, { quoted: mek });

  } catch (err) {
    console.error("YTComment Error:", err);
    
    if (err.code === 'ECONNABORTED') {
      return reply("❌ Request timed out. Try again later.");
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return reply("❌ API server is down. Try again later.");
    }
    if (err.response) {
      if (err.response.status === 502) {
        return reply("❌ API server is temporarily unavailable (502). Please try again in a few minutes.");
      }
      if (err.response.status === 504) {
        return reply("❌ API timeout (504). Please try again.");
      }
      return reply(`❌ API error: HTTP ${err.response.status}`);
    }
    return reply("❌ Failed to generate. Please try again later.");
  }
});
