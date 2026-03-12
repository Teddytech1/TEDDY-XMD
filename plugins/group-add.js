const { cmd } = require('../command')

/* =========================
   FULL ADMIN CHECK (LID FIX)
========================= */
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId)
        const participants = metadata.participants || []

        const botId = conn.user?.id || ''
        const botLid = conn.user?.lid || ''

        const extract = id =>
            id?.includes(':') ? id.split(':')[0] :
            id?.includes('@') ? id.split('@')[0] : id

        const botNumber = extract(botId)
        const botLidNum = extract(botLid)
        const senderNum = extract(senderId)

        let isBotAdmin = false
        let isSenderAdmin = false

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {

                const pId = extract(p.id)
                const pLid = extract(p.lid)
                const pPhone = extract(p.phoneNumber)
                const pFullId = p.id || ''
                const pFullLid = p.lid || ''

                // BOT ADMIN CHECK
                if (
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNum === pLid ||
                    botNumber === pPhone ||
                    botNumber === pId
                ) {
                    isBotAdmin = true
                }

                // SENDER ADMIN CHECK
                if (
                    senderId === pFullId ||
                    senderNum === pPhone ||
                    senderNum === pId ||
                    (pLid && senderNum === pLid)
                ) {
                    isSenderAdmin = true
                }
            }
        }

        return { isBotAdmin, isSenderAdmin }
    } catch (err) {
        console.error('Admin check error:', err)
        return { isBotAdmin: false, isSenderAdmin: false }
    }
}

/* =========================
   ➕ ADD MEMBER
========================= */
cmd({
    pattern: "add",
    alias: ["invite"],
    desc: "Add a member to the group using their number",
    category: "group",
    react: "➕",
    filename: __filename
},
async (conn, mek, m, { from, q, isGroup, reply }) => {

    if (!isGroup)
        return reply("❌ This command can only be used in groups.")

    const senderId = mek.key.participant || mek.key.remoteJid
    const { isBotAdmin, isSenderAdmin } =
        await checkAdminStatus(conn, from, senderId)

    if (!isSenderAdmin)
        return reply("❌ Only group admins can use this command.")

    if (!isBotAdmin)
        return reply("❌ I need to be an admin to add members.")

    if (!q || !/^\d+$/.test(q))
        return reply("📱 Please provide a valid phone number.\nExample: `.add 254799963583`")

    const userJid = `${q}@s.whatsapp.net`

    try {
        await conn.groupParticipantsUpdate(from, [userJid], "add")

        reply(`✅ Successfully added @${q}\n~ TEDDY-XMD`, {
            mentions: [userJid]
        })

    } catch (error) {
        console.error("Add command error:", error)

        if (error?.data?.error?.includes("not-authorized")) {
            reply("⚠️ This user’s privacy settings prevent being added to groups.")
        } else {
            reply("❌ Failed to add the member. Please try again later.")
        }
    }
})