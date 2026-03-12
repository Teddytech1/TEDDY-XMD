const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

function getGoogleImageSearch(query) {
    const apis = [
        `https://jawad-tech.vercel.app/search/gimage?q=${encodeURIComponent(query)}`,
        `https://api.delirius.xyz/search/gimage?query=${encodeURIComponent(query)}`,
        `https://api.siputzx.my.id/api/images?query=${encodeURIComponent(query)}`
    ]
    
    const getAll = async () => {
        for (const url of apis) {
            try {
                const res = await axios.get(url)
                const data = res.data
                
                // Handle different response structures
                let urls = []
                if (Array.isArray(data?.result)) {
                    // For jawad-tech API (uses "result" array)
                    urls = data.result.map(d => d.url).filter(u => typeof u === 'string' && u.startsWith('http'))
                } else if (Array.isArray(data?.data)) {
                    // For other APIs (uses "data" array)
                    urls = data.data.map(d => d.url).filter(u => typeof u === 'string' && u.startsWith('http'))
                }
                
                if (urls.length) return urls
            } catch {}
        }
        return []
    }
    
    return { 
        getAll,
        getRandom: async () => {
            const all = await getAll()
            return all[Math.floor(Math.random() * all.length)] || null
        }
    }
}

cmd({
    pattern: "imagen",
    alias: ["image", "img"],
    react: "🕒",
    desc: "Search for images",
    category: "search",
    use: ".imagen <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❀ Please enter a text to search for an Image.`)

        await reply("*SEARCHING FOR IMAGES...*")

        const res = await getGoogleImageSearch(q)
        const urls = await res.getAll()
        
        if (urls.length < 2) return reply('✧ Not enough images found for an album.')
        
        const medias = urls.slice(0, 10).map(url => ({ image: { url } }))
        const caption = `> TEDDY-XMD RESULTS FOR: ${q}`
        
        // Send multiple images
        for (let media of medias) {
            await conn.sendMessage(from, media, { quoted: m })
        }
        
        await conn.sendMessage(from, { text: caption }, { quoted: m })

    } catch (error) {
        console.error('Image Search Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})
