const { cmd } = require('../command');
const config = require('../config');

// In-memory map to track which groups have Anti-Promote active
const antiPromoteActive = new Map();

// ensure we register the event listener only once
let listenerRegistered = false;

cmd({
  pattern: "antipromote",
  desc: "Toggle Anti-Promote (on/off) — only group admins can toggle. When ON: if an admin promotes someone, both are demoted (bot never demotes itself).",
  category: "security",
  react: "🚫",
  filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, senderNumber, reply, args }) => {
  try {
    if (!isGroup) return reply("❌ This command works only in groups.");
    if (!isAdmins) return reply("❌ Only group admins can activate or deactivate this feature.");
    if (!isBotAdmins) return reply("❌ I need admin rights to manage admins in this group.");

    const arg = (args && args[0]) ? args[0].toLowerCase() : null;
    if (!arg || (arg !== 'on' && arg !== 'off')) {
      return reply("Usage: .antipromote on  OR  .antipromote off\nOnly group admins can toggle this, and the bot must be admin.");
    }

    if (arg === 'on') {
      antiPromoteActive.set(from, true);
      reply("✅ Anti-Promote is now *ON* for this group. If any admin promotes someone, both will be demoted (bot will never demote itself).");

      // Register single global listener if not already
      if (!listenerRegistered) {
        listenerRegistered = true;

        conn.ev.on('group-participants.update', async (update) => {
          try {
            // only handle promote events
            if (!update || update.action !== 'promote') return;

            const groupId = update.id;
            // if feature not active for this group, ignore
            if (!antiPromoteActive.get(groupId)) return;

            const promoter = update.author; // e.g. "12345@s.whatsapp.net"
            const promotedList = update.participants || [];
            if (!promotedList.length) return;

            // handle each promoted user (usually one)
            for (const promotedUser of promotedList) {
              // bot identity
              const botJid = conn.user && conn.user.id ? (conn.user.id.split(":")[0] + '@s.whatsapp.net') : null;

              // safety: do not act if bot is not admin anymore
              // (we cannot easily check isBotAdmins here, but attempt demote only if botJid exists)
              if (!botJid) return;

              // Do not demote if promoter or promotedUser is the bot itself
              if (promoter === botJid || promotedUser === botJid) {
                // ignore this event
                return;
              }

              // Optional: skip if promoter is group owner? (commented out — remove if you WANT to demote even owner)
              // const metadata = await conn.groupMetadata(groupId);
              // const groupOwnerJid = metadata.owner;
              // if (promoter === groupOwnerJid) return;

              // Announce and demote both
              try {
                await conn.sendMessage(groupId, {
                  text: `🚫 *Anti-Promote Triggered!*\n\n@${promoter.split('@')[0]} promoted @${promotedUser.split('@')[0]}.\nBoth will be demoted automatically.`,
                  mentions: [promoter, promotedUser]
                });
              } catch (e) {
                // ignore announce errors
              }

              // demote both promoter and promotedUser
              try {
                await conn.groupParticipantsUpdate(groupId, [promoter, promotedUser], "demote");
                console.log(`Anti-Promote: demoted ${promoter} and ${promotedUser} in ${groupId}`);
              } catch (err) {
                console.error("Anti-Promote demotion error:", err);
              }
            }
          } catch (err) {
            console.error("Anti-Promote listener error:", err);
          }
        });
      }

    } else if (arg === 'off') {
      antiPromoteActive.delete(from);
      reply("✅ Anti-Promote is now *OFF* for this group.");
    }
  } catch (e) {
    console.error("Antipromote command error:", e);
    reply("❌ An error occurred while toggling Anti-Promote.");
  }
});
