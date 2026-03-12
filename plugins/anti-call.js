const { cmd } = require('../command');
const config = require('../config');
let called = false;
let antiCallEnabled = config.ANTI_CALL === "true"; // Initial value from config

// Activation / désactivation via commande
cmd({
  pattern: "anticall",
  alias: ["callblock", "rejectcall"],
  desc: "Enable or disable auto call reject feature.",
  category: "settings",
  filename: __filename
}, async (conn, m, msg, { text }) => {
  if (!text) return m.reply("*ᴜsᴇ: .ANTICALL ON | OFF*");

  if (text.toLowerCase() === "on") {
    antiCallEnabled = true;
    m.reply("*✅ ANTICALL ENABLED*");
  } else if (text.toLowerCase() === "off") {
    antiCallEnabled = false;
    m.reply("*❌ ANTICALL DISABLED*");
  } else {
    m.reply("*ᴜsᴇ: .ANTICALL ON | OFF*");
  }
});

// Événement sur les appels
cmd({ on: "body" }, async (conn, m, msg, { from }) => {
  try {
    if (!called) {
      conn.ev.on('call', async (calls) => {
        if (!antiCallEnabled) return;

        for (const call of calls) {
          if (call.status !== "offer") continue;

          await conn.rejectCall(call.id, call.from);

          if (!call.isGroup) {
            await conn.sendMessage(call.from, {
              text: "*📵 DARKZONE-MD NOT ALLOWED CALL*",
              mentions: [call.from]
            });
          }
        }
      });

      called = true;
    }
  } catch (err) {
    console.error(err);
    m.reply("❌ Error:\n" + err.toString());
  }
});
