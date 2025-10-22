const { gmd } = require("../teddy");


gmd({ 
  pattern: "unmute", 
  react: "⏳",
  aliases: ['open', 'groupopen', 'gcopen', 'adminonly', 'adminsonly'],
  category: "group",
  description: "Open Group Chat.",
}, async (from, Gifted, conText) => {
  const { reply, isAdmin, isGroup, isBotAdmin, mek, sender } = conText;

  if (!isGroup) {
    return Gifted.sendMessage(from, { text: "Groups Only Command only" });
  }

  if (!isAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} you are not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    });
  }

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} This bot is not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }
          
  await Gifted.groupSettingUpdate(from, 'not_announcement');
  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} Group successfully unmuted as you wished!`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }
});


gmd({ 
  pattern: "mute", 
  react: "⏳",
  aliases: ['close', 'groupmute', 'gcmute', 'gcclose'],
  category: "group",
  description: "Close Group Chat",
}, async (from, Gifted, conText) => {
  const { reply, isAdmin, isGroup, isBotAdmin, mek, sender } = conText;

  if (!isGroup) {
    return Gifted.sendMessage(from, { text: "Groups Only Command only" });
  }

  if (!isAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} you are not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    });
  }

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} This bot is not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }
          
  await Gifted.groupSettingUpdate(from, 'announcement');
  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} Group successfully muted as you wished!`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }
});


gmd({ 
  pattern: "met",
  react: "⚡",
  category: "general",
  description: "Check group metadata",
}, async (from, Gifted, conText) => {
  const { mek, react, newsletterJid, botName } = conText;
  try {
    const gInfo = await Gifted.groupMetadata(from);
    console.log(gInfo);
    
    const formatJid = (jid) => {
      if (!jid) return 'N/A';
      const cleanJid = `@${jid.split('@')[0]}`;
      return cleanJid;
    };

    const superAdmins = [];
    const admins = [];
    const members = [];
    
    gInfo.participants.forEach(p => {
      const formattedJid = formatJid(p.jid || p.pn);
      if (p.admin === 'superadmin') {
        superAdmins.push(`• ${formattedJid} - 👑 Super Admin`);
      } else if (p.admin === 'admin') {
        admins.push(`• ${formattedJid} - 👮 Admin`);
      } else {
        members.push(`• ${formattedJid} - 👤 Member`);
      }
    });

    const allParticipants = [...superAdmins, ...admins, ...members].join('\n');

    const allAdmins = [...superAdmins.map(s => s.replace(' - 👑 Super Admin', '')), 
                      ...admins.map(a => a.replace(' - 👮 Admin', ''))];

    const metadataText = `
📌 *GROUP METADATA* 📌

🔹 *ID:* ${gInfo.id}
🔹 *Subject:* ${gInfo.subject || 'None'}
🔹 *Subject Owner:* ${formatJid(gInfo.subjectOwnerJid)}
🔹 *Subject Changed:* ${new Date(gInfo.subjectTime * 1000).toLocaleString()}
🔹 *Owner:* ${formatJid(gInfo.ownerJid)}
🔹 *Creation Date:* ${new Date(gInfo.creation * 1000).toLocaleString()}
🔹 *Size:* ${gInfo.size} participants
🔹 *Description:* ${gInfo.desc || 'None'}
🔹 *Description Owner:* ${formatJid(gInfo.descOwnerJid)}
🔹 *Description Changed:* ${new Date(gInfo.descTime * 1000).toLocaleString()}

👑 *ADMINS (${superAdmins.length + admins.length})*
${allAdmins.join('\n') || 'No admins'}

👥 *PARTICIPANTS (${gInfo.participants.length})*
${allParticipants}

ℹ️ *GROUP SETTINGS*
• Restrict: ${gInfo.restrict ? '✅' : '❌'}
• Announce: ${gInfo.announce ? '✅' : '❌'}
• Join Approval: ${gInfo.joinApprovalMode ? '✅' : '❌'}
• Member Add: ${gInfo.memberAddMode ? '✅' : '❌'}
• Community: ${gInfo.isCommunity ? '✅' : '❌'}
    `.trim();

    await Gifted.sendMessage(from, {
      text: metadataText,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: botName,
          serverMessageId: 143
        }
      }
    }, { quoted: mek });
    await react("✅");
  } catch (error) {
    console.error("Error in metadata command:", error);
    await react("❌");
    await Gifted.sendMessage(from, { text: "Failed to fetch group metadata." }, { quoted: mek });
  }
});


gmd({
  pattern: "demote",
  react: "👑",
  category: "owner",
  description: "Demote a user from being an admin.",
}, async (from, Gifted, conText) => {
  const { reply, react, sender, quotedUser, superUser, isSuperAdmin, isAdmin, isGroup, isBotAdmin, mek } = conText;

  if (!isGroup) {
    return reply("This command only works in groups!");
  }

  if (!isAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} you are not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} This bot is not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!quotedUser) {
    await react("❌");
    return reply(`Please reply to/quote a user or their message!`);
  }
 let result;
  if (quotedUser) {
      if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
        result = quotedUser.replace('@', '') + '@lid';
      } else {
        result = quotedUser;
      }
    }

    let finalResult = result;
    if (result && result.includes('@lid')) {
      finalResult = await Gifted.getJidFromLid(result);
    }

  if (superUser.includes(finalResult)) {
    await react("❌");
    return reply("I cannot demote my creator!");
  }


  if (!finalResult.includes(isAdmin)) {
    const userNumber = finalResult.split('@')[0];
    return reply(`@${userNumber} is already not an admin`);
  }

  if (finalResult.includes(isSuperAdmin)) {
    await react("❌");
    return reply("I cannot demote the group creator!");
  }

  try {
    await Gifted.groupParticipantsUpdate(from, [finalResult], 'demote'); 
    const demotedUser = finalResult.split('@')[0];
    await reply(`@${demotedUser} is no longer an admin. 👑`, { mentions: [`${demotedUser}@s.whatsapp.net`] }); 
    await react("✅");
  } catch (error) {
    console.error("Demotion Error:", error);
    await reply(`❌ Failed to demote: ${error.message}`);
    await react("❌");
  }
});


gmd({
  pattern: "promote",
  aliases: ['toadmin'],
  react: "👑",
  category: "owner",
  description: "Promote a user to admin.",
}, async (from, Gifted, conText) => {
  const { reply, react, sender, quotedUser, superUser, isSuperAdmin, isAdmin, isGroup, isBotAdmin, mek } = conText;

  if (!isGroup) {
    return reply("This command only works in groups!");
  }

  if (!isAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} you are not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!isBotAdmin) {
    const userNumber = sender.split('@')[0];
    return Gifted.sendMessage(from, { 
      text: `@${userNumber} This bot is not an admin`, 
      mentions: [`${userNumber}@s.whatsapp.net`]
    }, { quoted: mek });
  }

  if (!quotedUser) {
    return reply("Please reply to/quote a user to promote");
  }
  let result;
  if (quotedUser) {
      if (quotedUser.startsWith('@') && quotedUser.includes('@lid')) {
        result = quotedUser.replace('@', '') + '@lid';
      } else {
        result = quotedUser;
      }
    }

    let finalResult = result;
    if (result && result.includes('@lid')) {
      finalResult = await Gifted.getJidFromLid(result);
    }

  if (finalResult.includes(isAdmin)) {
    const userNumber = finalResult.split('@')[0];
    return reply(`@${userNumber} is already an admin`);
  }

  if (finalResult.includes(isSuperAdmin)) {
    const userNumber = finalResult.split('@')[0];
    return reply(`@${userNumber} is already an admin`);
  }

  try {
    await Gifted.groupParticipantsUpdate(from, [finalResult], 'promote'); 
    const promotedUser = finalResult.split('@')[0];
    await reply(`@${promotedUser} is now an admin. 👑`, { mentions: [`${promotedUser}@s.whatsapp.net`] }); 
    await react("✅");
  } catch (error) {
    console.error("Promotion Error:", error);
    await reply(`❌ Failed to promote: ${error.message}`);
    await react("❌");
  }
});
