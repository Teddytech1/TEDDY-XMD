const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "pinsearch",
    alias: ["pinstalk", "pintereststalk"],
    react: "📌",
    desc: "Get Pinterest user information",
    category: "stalker",
    use: ".pinterest <username>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply("❌ Please provide a Pinterest username\n\nExample:\n.pinterest darkzone");
        }

        const username = args[0];
        const apiUrl = `https://api.elrayyxml.web.id/api/stalker/pinterest?username=${username}`;

        const res = await axios.get(apiUrl);
        if (!res.data.status) {
            return reply("❌ Pinterest user not found.");
        }

        const data = res.data.result;

        const caption = `
📌 *Pinterest User Information*

👤 *Username:* ${data.username}
📛 *Full Name:* ${data.full_name || "N/A"}
🆔 *User ID:* ${data.id}
📄 *Account Type:* ${data.account_type || "N/A"}
🏷️ *User Type:* ${data.type}

📝 *Bio:*
${data.bio || "No bio available."}

📊 *Statistics*
📌 Pins: ${data.stats?.pins ?? "N/A"}
👥 Followers: ${data.stats?.followers ?? "N/A"}
➡️ Following: ${data.stats?.following ?? "N/A"}
📁 Boards: ${data.stats?.boards ?? "N/A"}
❤️ Likes: ${data.stats?.likes ?? "N/A"}
💾 Saves: ${data.stats?.saves ?? "N/A"}

📍 *Location:* ${data.location || "N/A"}
🌍 *Country:* ${data.country || "N/A"}
🏢 *Website:* ${data.website || "N/A"}
🌐 *Domain:* ${data.domain_url || "N/A"}
✔️ *Domain Verified:* ${data.domain_verified ? "Yes" : "No"}

🔐 *Security*
🔑 Has Password: ${data.has_password ? "Yes" : "No"}
🛡️ MFA Enabled: ${data.has_mfa ? "Yes" : "No"}

📅 *Account Created:* ${data.created_at}
⏱️ *Last Login:* ${data.last_login || "N/A"}

🔗 *Profile URL:*
${data.profile_url}

━━━━━━━━━━━━━━━
⚡ Powered by *TEDDY-XMD*
        `.trim();

        await conn.sendMessage(
            from,
            {
                image: {
                    url: data.image?.original || data.image?.large
                },
                caption: caption
            },
            { quoted: m }
        );

    } catch (error) {
        console.error("PINTEREST STALK ERROR:", error);
        reply("❌ Failed to fetch Pinterest information. Please try again later.");
    }
});
