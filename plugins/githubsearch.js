const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "github",
    alias: ["ghstalk", "gitstalk"],
    react: "🐙",
    desc: "Get GitHub user information",
    category: "stalker",
    use: ".github <username>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a GitHub username\n\nExample:\n.github ERFAN-Md");
        }

        const username = args[0];
        const apiUrl = `https://api.elrayyxml.web.id/api/stalker/github?username=${username}`;

        const res = await axios.get(apiUrl);
        if (!res.data.status) {
            return reply("❌ User not found.");
        }

        const data = res.data.result;

        const caption = `
🐙 *GitHub User Information*

👤 *Username:* ${data.username}
📛 *Name:* ${data.nickname || "N/A"}
🆔 *User ID:* ${data.id}
🏢 *Company:* ${data.company || "N/A"}
📍 *Location:* ${data.location || "N/A"}
📝 *Bio:* ${data.bio || "N/A"}

📦 *Public Repos:* ${data.public_repo}
📄 *Public Gists:* ${data.public_gists}
👥 *Followers:* ${data.followers}
➡️ *Following:* ${data.following}

📅 *Created At:* ${data.created_at}
🔄 *Updated At:* ${data.updated_at}

⚙️ *Account Type:* ${data.type}
🛡️ *Admin:* ${data.admin ? "Yes" : "No"}

━━━━━━━━━━━━━━━
⚡ Powered by *DARKZONE-MD*
        `.trim();

        await conn.sendMessage(
            from,
            {
                image: { url: data.profile_pic },
                caption: caption
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("GITHUB STALK ERROR:", err);
        reply("❌ Failed to fetch GitHub information. Please try again later.");
    }
});
