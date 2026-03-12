const { cmd } = require('../command');
const axios = require('axios');
const qs = require('querystring');

cmd({
  pattern: "profilecard",
  alias: ["profile", "pcard"],
  desc: "Generate a personalized profile card image (PNG) using remote API",
  category: "image-tools",
  use: ".profilecard name=<name> rankName=<rank> level=<num> exp=<num> requireExp=<num> avatarURL=<url> backgroundURL=<url>",
  filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
  try {
    // If no arguments provided — show example usage
    if (!args.length) {
      return reply(
`✨ *Example Usage:*
.profilecard name=TEDDY-XMD rankName=Pro rankId=2 level=15 exp=500 requireExp=900 avatarURL=https://files.catbox.moe/13nyhx.jpg backgroundURL=https://files.catbox.moe/9yy6iy.jpg

🧩 *Tip:* Replace the values with your own name, level, and images.`
      );
    }

    // parse args like key=value
    const params = {};
    for (const token of args) {
      const [k, ...rest] = token.split("=");
      if (!k) continue;
      params[k] = rest.join("=").trim();
    }

    // set defaults if missing
    const backgroundURL = params.backgroundURL || params.bg || "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";
    const avatarURL = params.avatarURL || params.avatar || "https://avatars.githubusercontent.com/u/9919?v=4";
    const name = params.name || "Player";
    const level = params.level || "1";
    const exp = params.exp || "0";
    const requireExp = params.requireExp || "100";
    const rankName = params.rankName || "Rookie";
    const rankId = params.rankId || "0";

    await reply("⏳ Generating your profile card, please wait...");

    const query = qs.stringify({
      backgroundURL,
      avatarURL,
      name,
      level,
      exp,
      requireExp,
      rankName,
      rankId
    });

    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/canvas/profile?${query}`;

    const res = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      headers: { accept: '*/*' },
      timeout: 30000
    });

    const contentType = (res.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const text = Buffer.from(res.data).toString('utf8');
      let json;
      try { json = JSON.parse(text); } catch (e) { json = { error: text }; }
      const errMsg = json.error || json.message || JSON.stringify(json);
      return reply(` WAIT 4 SECOND`);
    }

    const imageBuffer = Buffer.from(res.data);
    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✅ Profile Card Generated!\n👤 *${name}*\n🎖 Rank: ${rankName}\n⭐ Level: ${level}\n📊 Exp: ${exp}/${requireExp}`
    }, { quoted: mek });

  } catch (err) {
    console.error("ProfileCard Error:", err.message);
    if (err.code === 'ECONNABORTED') return reply("❌ Request timed out. Try again later.");
    if (err.response && err.response.status) return reply(`❌ API error: HTTP ${err.response.status}`);
    return reply("❌ Failed to generate profile card. Please try again later.");
  }
});
