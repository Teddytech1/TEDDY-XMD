
const { cmd } = require('../command')

// Storage for auto-approve enabled groups
let autoApproveGroups = {}

// Flag to track if event listener is already added
let eventListenerAdded = false

/* =========================
   ADMIN CHECK FUNCTION
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
   SETUP AUTO-APPROVE EVENT LISTENER
========================= */
function setupAutoApproveListener(conn) {
    if (eventListenerAdded) return
    eventListenerAdded = true

    // Listen for new join requests
    conn.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update

            // Check for join request
            if (action === 'add' || action === 'request' || action === 'pending') {
                return
            }
        } catch (e) {
            console.error('Auto-approve listener error:', e)
        }
    })

    // Listen for join request events
    conn.ev.on('group.join-request', async (request) => {
        try {
            const groupId = request.id || request.groupId || request.jid
            
            if (autoApproveGroups[groupId]) {
                const participants = request.participants || [request.participant]
                
                await conn.groupRequestParticipantsUpdate(
                    groupId,
                    participants,
                    "approve"
                )
                console.log(`✅ Auto-approved in: ${groupId}`)
            }
        } catch (e) {
            console.error('Auto-approve error:', e)
        }
    })

    // Polling method - check every 5 seconds for pending requests
    setInterval(async () => {
        for (let groupId in autoApproveGroups) {
            if (autoApproveGroups[groupId]) {
                try {
                    const requests = await conn.groupRequestParticipantsList(groupId)
                    if (requests && requests.length > 0) {
                        await conn.groupRequestParticipantsUpdate(
                            groupId,
                            requests.map(u => u.jid),
                            "approve"
                        )
                        console.log(`✅ Auto-approved ${requests.length} request(s) in: ${groupId}`)
                    }
                } catch (e) {
                    // Group might not exist anymore or bot is not admin
                    if (e.message?.includes('not-authorized') || e.message?.includes('forbidden')) {
                        delete autoApproveGroups[groupId]
                    }
                }
            }
        }
    }, 5000) // Check every 5 seconds

    console.log('✅ Auto-approve listener initialized')
}

/* =========================
   ⚙️ AUTO APPROVE COMMAND
========================= */
cmd({
    pattern: "autoapprove",
    react: "⚙️",
    desc: "Enable/Disable auto approve for join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, args, reply }) => {
    try {
        // Setup listener on first command use
        setupAutoApproveListener(conn)

        if (!isGroup)
            return reply("❌ This command can only be used in groups.")

        const senderId = mek.key.participant || mek.key.remoteJid
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId)

        if (!isSenderAdmin)
            return reply("❌ Only group admins can use this command.")
        if (!isBotAdmin)
            return reply("❌ I must be an admin to manage auto-approve.")

        const action = args[0]?.toLowerCase()

        if (action === "on") {
            autoApproveGroups[from] = true
            
            // Approve any existing pending requests immediately
            try {
                const requests = await conn.groupRequestParticipantsList(from)
                if (requests.length > 0) {
                    await conn.groupRequestParticipantsUpdate(
                        from,
                        requests.map(u => u.jid),
                        "approve"
                    )
                    return reply(`✅ *Auto-Approve ENABLED*\n\n🔄 Approved ${requests.length} pending request(s).\n\n📌 New requests will be auto-approved instantly.`)
                }
            } catch (e) {}
            
            return reply("✅ *Auto-Approve ENABLED*\n\n📌 New join requests will be auto-approved instantly.")
            
        } else if (action === "off") {
            delete autoApproveGroups[from]
            return reply("❌ *Auto-Approve DISABLED*\n\n📌 Join requests will need manual approval.")
            
        } else {
            const status = autoApproveGroups[from] ? "✅ ON" : "❌ OFF"
            return reply(`⚙️ *Auto-Approve Status: ${status}*\n\n💡 *Usage:*\n• .autoapprove on\n• .autoapprove off`)
        }
    } catch (e) {
        console.error("autoapprove error:", e)
        reply("❌ Failed to update auto-approve settings.")
    }
})
