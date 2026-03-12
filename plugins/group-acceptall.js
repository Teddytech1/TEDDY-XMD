
const { cmd } = require('../command')

/* =========================
   FULL ADMIN CHECK (LID FIXED)
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
        const botIdClean = extract(botId)
        const botLidNumber = extract(botLid)
        const botLidClean = extract(botLid)

        const senderNumber = extract(senderId)
        const senderClean = extract(senderId)

        let isBotAdmin = false
        let isSenderAdmin = false

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {

                const pId = extract(p.id)
                const pLid = extract(p.lid)
                const pPhone = extract(p.phoneNumber)
                const pFullId = p.id || ''
                const pFullLid = p.lid || ''

                // BOT ADMIN CHECK (FULL MATCH)
                const botMatches =
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumber === pLid ||
                    botLidClean === pLid ||
                    botNumber === pPhone ||
                    botNumber === pId ||
                    botIdClean === pPhone ||
                    botIdClean === pId ||
                    (botLid && extract(botLid) === pLid)

                if (botMatches) isBotAdmin = true

                // SENDER ADMIN CHECK (FULL MATCH)
                const senderMatches =
                    senderId === pFullId ||
                    senderId === pFullLid ||
                    senderNumber === pPhone ||
                    senderNumber === pId ||
                    senderClean === pPhone ||
                    senderClean === pId ||
                    (pLid && senderClean === pLid)

                if (senderMatches) isSenderAdmin = true
            }
        }

        return { isBotAdmin, isSenderAdmin }

    } catch (err) {
        console.error('❌ Admin check error:', err)
        return { isBotAdmin: false, isSenderAdmin: false }
    }
}

/* =========================
   📋 REQUEST LIST
========================= */
cmd({
    pattern: "requestlist",
    react: "📋",
    desc: "Show pending join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.")

        const senderId = mek.key.participant || mek.key.remoteJid
        const { isBotAdmin, isSenderAdmin } =
            await checkAdminStatus(conn, from, senderId)

        if (!isSenderAdmin)
            return reply("❌ Only group admins can use this command.")
        if (!isBotAdmin)
            return reply("❌ I must be an admin to view join requests.")

        const requests = await conn.groupRequestParticipantsList(from)

        if (!requests.length)
            return reply("ℹ️ No pending join requests.")

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`
        requests.forEach((u, i) => {
            text += `${i + 1}. @${u.jid.split('@')[0]}\n`
        })

        reply(text, { mentions: requests.map(u => u.jid) })
    } catch (e) {
        console.error("requestlist error:", e)
        reply("❌ Failed to fetch join requests.")
    }
})

/* =========================
   ✅ ACCEPT ALL
========================= */
cmd({
    pattern: "acceptall",
    react: "✅",
    desc: "Accept all pending join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.")

        const senderId = mek.key.participant || mek.key.remoteJid
        const { isBotAdmin, isSenderAdmin } =
            await checkAdminStatus(conn, from, senderId)

        if (!isSenderAdmin)
            return reply("❌ Only group admins can use this command.")
        if (!isBotAdmin)
            return reply("❌ I must be an admin to accept requests.")

        const requests = await conn.groupRequestParticipantsList(from)

        if (!requests.length)
            return reply("ℹ️ No pending join requests.")

        await conn.groupRequestParticipantsUpdate(
            from,
            requests.map(u => u.jid),
            "approve"
        )

        reply(`✅ Accepted ${requests.length} join requests.`)
    } catch (e) {
        console.error("acceptall error:", e)
        reply("❌ Failed to accept join requests.")
    }
})

/* =========================
   ❌ REJECT ALL
========================= */
cmd({
    pattern: "rejectall",
    react: "❌",
    desc: "Reject all pending join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.")

        const senderId = mek.key.participant || mek.key.remoteJid
        const { isBotAdmin, isSenderAdmin } =
            await checkAdminStatus(conn, from, senderId)

        if (!isSenderAdmin)
            return reply("❌ Only group admins can use this command.")
        if (!isBotAdmin)
            return reply("❌ I must be an admin to reject requests.")

        const requests = await conn.groupRequestParticipantsList(from)

        if (!requests.length)
            return reply("ℹ️ No pending join requests.")

        await conn.groupRequestParticipantsUpdate(
            from,
            requests.map(u => u.jid),
            "reject"
        )

        reply(`✅ Rejected ${requests.length} join requests.`)
    } catch (e) {
        console.error("rejectall error:", e)
        reply("❌ Failed to reject join requests.")
    }
})