const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "lovenight",
    alias: ["goodnight", "gn", "nightlove"],
    desc: "Get romantic good night poetry",
    category: "fun",
    react: "🌙",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        // Show processing reaction
        await Void.sendMessage(citel.chat, { 
            react: { text: '⏳', key: citel.key } 
        });
        
        // API URL
        const apiUrl = "https://shizoapi.onrender.com/api/texts/lovenight?apikey=shizo";
        
        // Fetch from API
        const response = await axios.get(apiUrl);
        
        // Check if response has result
        if (!response.data || !response.data.result) {
            return citel.reply("❌ Failed to fetch good night message!");
        }
        
        // Get the poetry text
        const poetry = response.data.result;
        
        // Create beautiful message
        const message = `🌙✨ *GOOD NIGHT* ✨🌙\n\n${poetry}\n\n💫 _Sweet Dreams_ 💫`;
        
        // Success reaction
        await Void.sendMessage(citel.chat, { 
            react: { text: '🌙', key: citel.key } 
        });
        
        // Send the message
        await citel.reply(message);
        
    } catch (error) {
        console.error("[LOVENIGHT ERROR]", error);
        citel.reply("❌ Error fetching good night message!");
    }
});



cmd({
    pattern: "flirt",
    alias: ["fl"],
    desc: "Get flirt lines",
    category: "fun",
    react: "😘",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        const res = await axios.get("https://shizoapi.onrender.com/api/texts/flirt?apikey=shizo");
        
        if (res.data?.result) {
            await citel.reply(res.data.result);
        }
    } catch (e) {
        citel.reply("❌ Error!");
    }
});




cmd({
    pattern: "quote",
    alias: ["quotes", "q"],
    desc: "Get random quotes",
    category: "fun",
    react: "💬",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        const res = await axios.get("https://shizoapi.onrender.com/api/texts/quotes?apikey=shizo");
        
        if (res.data?.result) {
            await citel.reply(res.data.result);
        }
    } catch (e) {
        citel.reply("❌ Error!");
    }
});
