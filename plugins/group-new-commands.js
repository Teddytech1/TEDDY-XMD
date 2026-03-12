/**
 * ╔══════════════════════════════════════════╗
 * ║  GROUP COMMANDS — LID FIXED VERSION      ║
 * ║  100 Unique Group Management Commands    ║
 * ╚══════════════════════════════════════════╝
 */

const config = require('../config')
const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

// ─── EXACT LID-COMPATIBLE ADMIN CHECK (as provided) ──────────────────────────
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.replace(/[:@].*/g, '');
        const botLidNumber = botLid ? botLid.replace(/[:@].*/g, '') : '';
        
        const senderNumber = senderId.replace(/[:@].*/g, '');
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            const isAdmin = p.admin === "admin" || p.admin === "superadmin";
            
            if (isAdmin) {
                const pNumber = p.id ? p.id.replace(/[:@].*/g, '') : '';
                const pLidNumber = p.lid ? p.lid.replace(/[:@].*/g, '') : '';
                
                if (pNumber === botNumber || 
                    pLidNumber === botNumber || 
                    pNumber === botLidNumber || 
                    pLidNumber === botLidNumber) {
                    isBotAdmin = true;
                }
                
                if (pNumber === senderNumber || 
                    pLidNumber === senderNumber) {
                    isSenderAdmin = true;
                }
            }
        }
        
        return { isBotAdmin, isSenderAdmin };
        
    } catch (err) {
        console.error('❌ Error checking admin status:', err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// ─── GET SENDER ID (LID safe) ─────────────────────────────────────────────────
function getSender(mek, conn) {
    return mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);
}

// ─── PERSISTENT GROUP DATABASE ────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '../data/group_db.json');
function loadDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
            fs.writeFileSync(DB_PATH, '{}');
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch { return {}; }
}
function saveDB(data) {
    try {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch {}
}
function getGD(groupId) {
    const db = loadDB();
    if (!db[groupId]) db[groupId] = {};
    return db[groupId];
}
function setGD(groupId, data) {
    const db = loadDB();
    db[groupId] = { ...(db[groupId] || {}), ...data };
    saveDB(db);
}

// ══════════════════════════════════════════════════════════════════════════════
//  ⚠️  WARNING SYSTEM  [1-7]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "warn", alias: ["warning"], use: ".warn @user [reason]", desc: "Warn a member. Auto-kick after limit.", category: "group", react: "⚠️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        if (!senderId) return reply("❌ Cannot identify sender.");
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user! Usage: .warn @user [reason]");
        const text = mek.message?.extendedTextMessage?.text || mek.message?.conversation || '';
        const reason = text.split(' ').slice(2).join(' ') || 'No reason given';
        const gd = getGD(from);
        if (!gd.warns) gd.warns = {};
        if (!gd.warns[target]) gd.warns[target] = 0;
        gd.warns[target]++;
        const limit = gd.warnlimit || 3;
        setGD(from, gd);
        if (gd.warns[target] >= limit) {
            await conn.groupParticipantsUpdate(from, [target], 'remove');
            gd.warns[target] = 0; setGD(from, gd);
            reply(`⚠️ *WARNED & KICKED*\n\n👤 @${target.split('@')[0]}\n📝 ${reason}\n\n🚫 Warn limit (${limit}) reached — AUTO KICKED!`, [target]);
        } else {
            reply(`⚠️ *WARNING #${gd.warns[target]}/${limit}*\n\n👤 @${target.split('@')[0]}\n📝 Reason: ${reason}\n\n_${limit - gd.warns[target]} more = kicked!_`, [target]);
        }
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "warnlist", alias: ["warnings"], desc: "Show all warned members", category: "group", react: "📋", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        const limit = gd.warnlimit || 3;
        const entries = Object.entries(gd.warns || {}).filter(([, v]) => v > 0);
        if (!entries.length) return reply("✅ No warned members!");
        reply(`📋 *WARN LIST* (limit: ${limit})\n\n${entries.map(([jid, c]) => `👤 @${jid.split('@')[0]} — ⚠️ ${c}/${limit}`).join('\n')}`, entries.map(([j]) => j));
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "resetwarn", alias: ["clearwarn"], use: ".resetwarn @user", desc: "Reset warnings for a user", category: "group", react: "🔄", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.warns) gd.warns = {};
        gd.warns[target] = 0; setGD(from, gd);
        reply(`✅ Warnings reset for @${target.split('@')[0]}!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setwarnlimit", alias: ["warnlimit"], use: ".setwarnlimit 5", desc: "Set auto-kick warn limit (1-20)", category: "group", react: "🔢", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const num = parseInt(args[0]);
        if (!num || num < 1 || num > 20) return reply("❌ Usage: .setwarnlimit 3 (1-20)");
        setGD(from, { warnlimit: num });
        reply(`✅ Warn limit set to *${num}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "warnall", alias: ["globalwarn"], use: ".warnall [reason]", desc: "Warn all non-admin members", category: "group", react: "🔴", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const reason = args.join(' ') || 'General warning';
        const meta = await conn.groupMetadata(from);
        const gd = getGD(from);
        if (!gd.warns) gd.warns = {};
        const limit = gd.warnlimit || 3;
        const nonAdmins = meta.participants.filter(p => !p.admin);
        nonAdmins.forEach(p => { if (!gd.warns[p.id]) gd.warns[p.id] = 0; gd.warns[p.id]++; });
        setGD(from, gd);
        reply(`🔴 *${nonAdmins.length} MEMBERS WARNED!*\n📝 Reason: ${reason}\n⚠️ Limit: ${limit}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "warnkick", alias: ["kickwarn"], use: ".warnkick @user", desc: "Instantly kick a warned user", category: "group", react: "🚫", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        reply(`🚫 @${target.split('@')[0]} kicked! Had ${gd.warns?.[target] || 0} warning(s).`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "warnstatus", alias: ["mywarns"], desc: "Check warning count for a user", category: "group", react: "🔍", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || senderId;
    const gd = getGD(from);
    const count = gd.warns?.[target] || 0;
    const limit = gd.warnlimit || 3;
    reply(`🔍 *WARN STATUS*\n\n👤 @${target.split('@')[0]}\n⚠️ ${count}/${limit}\n${count >= limit ? '🚫 At limit!' : `✅ ${limit - count} left`}`, [target]);
});

// ══════════════════════════════════════════════════════════════════════════════
//  🛡️  ANTI SYSTEM  [8-16]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "antispam", alias: ["spamblock"], use: ".antispam on/off", desc: "Toggle anti-spam protection", category: "group", react: "🛡️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antispam on/off");
        setGD(from, { antispam: toggle === 'on' });
        reply(`🛡️ Anti-Spam *${toggle === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "antiflood", alias: ["floodprot"], use: ".antiflood on/off [limit]", desc: "Toggle anti-flood protection", category: "group", react: "🌊", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antiflood on/off [msgs]");
        const limit = parseInt(args[1]) || 5;
        setGD(from, { antiflood: toggle === 'on', floodlimit: limit });
        reply(`🌊 Anti-Flood *${toggle === 'on' ? `ENABLED ✅ (max ${limit}/10s)` : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "antinsfw", alias: ["nsfwprot"], use: ".antinsfw on/off", desc: "Toggle NSFW content blocking", category: "group", react: "🔞", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antinsfw on/off");
        setGD(from, { antinsfw: toggle === 'on' });
        reply(`🔞 Anti-NSFW *${toggle === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "antiword", alias: ["wordfilter"], use: ".antiword on/off", desc: "Toggle word filter system", category: "group", react: "🤐", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antiword on/off");
        setGD(from, { antiword: toggle === 'on' });
        reply(`🤐 Word Filter *${toggle === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "addword", alias: ["banword"], use: ".addword badword", desc: "Add word to group ban list", category: "group", react: "➕", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const word = args[0]?.toLowerCase();
        if (!word) return reply("❌ .addword <word>");
        const gd = getGD(from);
        if (!gd.bannedwords) gd.bannedwords = [];
        if (gd.bannedwords.includes(word)) return reply(`❌ "${word}" already banned!`);
        gd.bannedwords.push(word); setGD(from, gd);
        reply(`✅ "*${word}*" banned! Total: ${gd.bannedwords.length}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "removeword", alias: ["unbanword"], use: ".removeword word", desc: "Remove word from ban list", category: "group", react: "➖", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const word = args[0]?.toLowerCase();
        if (!word) return reply("❌ .removeword <word>");
        const gd = getGD(from);
        if (!gd.bannedwords) gd.bannedwords = [];
        const idx = gd.bannedwords.indexOf(word);
        if (idx === -1) return reply(`❌ "${word}" not found!`);
        gd.bannedwords.splice(idx, 1); setGD(from, gd);
        reply(`✅ "*${word}*" removed!`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "wordlist", alias: ["bannedwords"], desc: "Show all banned words", category: "group", react: "📝", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        const words = gd.bannedwords || [];
        if (!words.length) return reply("✅ No banned words!");
        reply(`🤐 *BANNED WORDS*\n\n${words.map((w, i) => `${i+1}. ${w}`).join('\n')}\n\nTotal: ${words.length}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "antifake", alias: ["fakeblock", "blockfake"], use: ".antifake on/off", desc: "Block fake/temp number accounts", category: "group", react: "🕵️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antifake on/off");
        setGD(from, { antifake: toggle === 'on' });
        reply(`🕵️ Anti-Fake Number *${toggle === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "antibotadd", alias: ["botguard"], use: ".antibotadd on/off", desc: "Prevent bots being added to group", category: "group", react: "🤖", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const toggle = args[0]?.toLowerCase();
        if (!['on','off'].includes(toggle)) return reply("❌ .antibotadd on/off");
        setGD(from, { antibotadd: toggle === 'on' });
        reply(`🤖 Anti-Bot Add *${toggle === 'on' ? 'ENABLED ✅' : 'DISABLED ❌'}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  📋  GROUP RULES  [17-20]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "setrules", alias: ["setgcrules"], use: ".setrules Rule 1 | Rule 2 | Rule 3", desc: "Set group rules", category: "group", react: "📜", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const text = args.join(' ');
        if (!text) return reply("❌ .setrules Rule 1 | Rule 2");
        const rules = text.split('|').map((r, i) => `${i+1}. ${r.trim()}`).filter(r => r.length > 3);
        setGD(from, { rules });
        reply(`📜 *RULES SET!*\n\n${rules.join('\n')}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "rules", alias: ["showrules", "grules"], desc: "Show group rules", category: "group", react: "📜", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const gd = getGD(from);
        const rules = gd.rules || [];
        if (!rules.length) return reply("❌ No rules! Admins: .setrules");
        reply(`📜 *${meta.subject} — RULES*\n\n${rules.join('\n')}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "clearrules", alias: ["delrules"], desc: "Clear all group rules", category: "group", react: "🗑️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { rules: [] });
        reply("✅ Rules cleared!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "addrule", alias: ["newrule"], use: ".addrule No spamming", desc: "Add one rule to the list", category: "group", react: "➕", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const rule = args.join(' ');
        if (!rule) return reply("❌ .addrule <text>");
        const gd = getGD(from);
        if (!gd.rules) gd.rules = [];
        gd.rules.push(`${gd.rules.length + 1}. ${rule}`);
        setGD(from, gd);
        reply(`✅ Rule added! Total: ${gd.rules.length}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  📊  STATS & INFO  [21-30]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "groupstats", alias: ["gstats"], desc: "Full group statistics", category: "group", react: "📊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const total = meta.participants.length;
        const admins = meta.participants.filter(p => p.admin).length;
        const created = meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : 'Unknown';
        const gd = getGD(from);
        const warned = Object.values(gd.warns || {}).filter(v => v > 0).length;
        reply(`📊 *GROUP STATS — ${meta.subject}*\n\n👥 Total: ${total}\n👑 Admins: ${admins}\n🙍 Members: ${total - admins}\n📅 Created: ${created}\n\n🛡️ Anti-Spam: ${gd.antispam ? '✅' : '❌'}\n🌊 Anti-Flood: ${gd.antiflood ? '✅' : '❌'}\n🔞 Anti-NSFW: ${gd.antinsfw ? '✅' : '❌'}\n⚠️ Warned: ${warned}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "membercount", alias: ["mcount", "gccount"], desc: "Member count breakdown", category: "group", react: "👥", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const superAdmins = meta.participants.filter(p => p.admin === 'superadmin').length;
        const admins = meta.participants.filter(p => p.admin === 'admin').length;
        const regular = meta.participants.length - superAdmins - admins;
        reply(`👥 *MEMBER COUNT*\n\n📌 Total: *${meta.participants.length}*\n👑 Super Admins: ${superAdmins}\n⭐ Admins: ${admins}\n🙍 Regular: ${regular}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "adminlist", alias: ["listadmins", "gadmins"], desc: "List all group admins", category: "group", react: "👑", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const admins = meta.participants.filter(p => p.admin);
        if (!admins.length) return reply("❌ No admins!");
        const list = admins.map((a, i) => `${i+1}. @${a.id.split('@')[0]} ${a.admin === 'superadmin' ? '👑' : '⭐'}`).join('\n');
        reply(`👑 *ADMINS (${admins.length})*\n\n${list}`, admins.map(a => a.id));
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "memberlist", alias: ["listmembers", "gmembers"], desc: "List all group members", category: "group", react: "📋", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const meta = await conn.groupMetadata(from);
        const parts = meta.participants.slice(0, 50);
        const list = parts.map((p, i) => `${i+1}. ${p.admin === 'superadmin' ? '👑' : p.admin === 'admin' ? '⭐' : '🙍'} @${p.id.split('@')[0]}`).join('\n');
        reply(`📋 *MEMBERS (${meta.participants.length})*\n\n${list}${meta.participants.length > 50 ? `\n\n_+${meta.participants.length - 50} more_` : ''}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupage", alias: ["gcage", "howoldgc"], desc: "Show group creation age", category: "group", react: "🎂", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        if (!meta.creation) return reply("❌ Cannot fetch date!");
        const created = new Date(meta.creation * 1000);
        const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        reply(`🎂 *GROUP AGE*\n\n📛 ${meta.subject}\n📅 Created: ${created.toDateString()}\n⏳ Age: ${years > 0 ? years + 'y ' : ''}${months}m ${days % 30}d\n(${days} days total)`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupowner", alias: ["gcowner", "whoowns"], desc: "Show group creator/owner", category: "group", react: "👑", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const ownerId = meta.owner;
        if (!ownerId) return reply("❌ Cannot find owner!");
        reply(`👑 *GROUP OWNER*\n\n📛 ${meta.subject}\n👤 @${ownerId.split('@')[0]}`, [ownerId]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "grouplink2", alias: ["glink2", "invitelink"], desc: "Get group invite link", category: "group", react: "🔗", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const code = await conn.groupInviteCode(from);
        const meta = await conn.groupMetadata(from);
        reply(`🔗 *INVITE LINK*\n\n📛 ${meta.subject}\n👥 ${meta.participants.length} members\n\nhttps://chat.whatsapp.com/${code}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupsettings", alias: ["gcsettings"], desc: "View all bot group settings", category: "group", react: "⚙️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        reply(`⚙️ *BOT SETTINGS*\n\n🛡️ Anti-Spam: ${gd.antispam ? '✅' : '❌'}\n🌊 Anti-Flood: ${gd.antiflood ? '✅' : '❌'}\n🔞 Anti-NSFW: ${gd.antinsfw ? '✅' : '❌'}\n🤐 Word Filter: ${gd.antiword ? '✅' : '❌'}\n🤖 Anti-Bot: ${gd.antibotadd ? '✅' : '❌'}\n\n⚠️ Warn Limit: ${gd.warnlimit || 3}\n🤐 Banned Words: ${(gd.bannedwords||[]).length}\n👋 Welcome: ${gd.customwelcome ? '✅' : '❌'}\n💎 VIPs: ${(gd.vip||[]).length}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "topactive", alias: ["mostactive", "topmembers"], desc: "Top active members leaderboard", category: "group", react: "🏆", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const gd = getGD(from);
        const sorted = Object.entries(gd.msgcount || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (!sorted.length) return reply("❌ No stats yet! Bot tracks messages over time.");
        const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        reply(`🏆 *TOP ACTIVE*\n\n${sorted.map(([jid, c], i) => `${medals[i]} @${jid.split('@')[0]} — ${c} msgs`).join('\n')}`, sorted.map(([j]) => j));
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupfreeze", alias: ["freezegc", "freezegroup"], desc: "Freeze group — admins only can chat", category: "group", react: "🧊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        await conn.groupSettingUpdate(from, 'announcement');
        setGD(from, { frozen: true });
        reply("🧊 *GROUP FROZEN!*\n\nOnly admins can send messages.\nUse .unfreeze to restore.");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🎮  GROUP GAMES  [31-42]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "gtruth", alias: ["grouptruth"], desc: "Random truth question for group", category: "group", react: "🎭", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const qs = ["Who in this group do you have a crush on? 👀","What's your most embarrassing moment?","Have you ever lied to someone in this group?","If you had to date someone here, who?","What's the most money you've wasted?","Have you ever cheated on an exam?","What secret does nobody here know about you?","Have you ever faked being sick to avoid work?"];
    reply(`🤫 *TRUTH TIME!*\n\n❓ ${qs[Math.floor(Math.random() * qs.length)]}\n\n_Be honest!_`);
});

cmd({ pattern: "gdare", alias: ["groupdare"], desc: "Random dare for the group", category: "group", react: "😈", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const ds = ["Send a voice note singing 'Happy Birthday' right now! 🎂","Change your profile photo to something funny for 1 hour!","Tag 3 people and say something nice! 💕","Do 20 push-ups and send a voice note counting!","Send your most embarrassing photo!","Call someone in this group and keep for 30 seconds!"];
    reply(`😈 *DARE TIME!*\n\n🎯 ${ds[Math.floor(Math.random() * ds.length)]}\n\n_Complete it!_`);
});

cmd({ pattern: "groupquiz", alias: ["gcquiz"], desc: "Start a quiz in the group", category: "group", react: "🎓", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const quizzes = [
            { q: "Capital of Pakistan?", a: "Islamabad", opts: ["Karachi","Islamabad","Lahore","Peshawar"] },
            { q: "First Muslim Caliph?", a: "Abu Bakr (RA)", opts: ["Umar (RA)","Abu Bakr (RA)","Ali (RA)","Usman (RA)"] },
            { q: "2 + 2 × 2 = ?", a: "6", opts: ["8","6","4","10"] },
            { q: "How many Surahs in Quran?", a: "114", opts: ["113","115","114","112"] },
            { q: "Pakistan independence year?", a: "1947", opts: ["1945","1947","1948","1946"] }
        ];
        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const letters = ['A','B','C','D'];
        const opts = quiz.opts.map((o, i) => `${letters[i]}. ${o}`).join('\n');
        const gd = getGD(from);
        gd.activequiz = { answer: quiz.a, asked: Date.now() }; setGD(from, gd);
        reply(`🎓 *QUIZ!*\n\n❓ *${quiz.q}*\n\n${opts}\n\n_Use .groupanswer A/B/C/D_`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupanswer", alias: ["ganswer"], use: ".groupanswer A", desc: "Answer the active quiz", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const gd = getGD(from);
    if (!gd.activequiz) return reply("❌ No quiz! Use .groupquiz");
    const choice = args[0]?.toUpperCase();
    if (!choice) return reply("❌ .groupanswer A/B/C/D");
    const correct = gd.activequiz.answer;
    const isCorrect = correct.toLowerCase().includes(choice.toLowerCase()) || choice.toLowerCase() === correct.toLowerCase();
    if (isCorrect) {
        gd.activequiz = null;
        if (!gd.quizscores) gd.quizscores = {};
        gd.quizscores[senderId] = (gd.quizscores[senderId] || 0) + 1;
        setGD(from, gd);
        reply(`🏆 *CORRECT!*\n\n✅ @${senderId.split('@')[0]} wins!\n📝 Answer: ${correct}\n🎯 Score: ${gd.quizscores[senderId]}`, [senderId]);
    } else {
        reply(`❌ Wrong! Try again @${senderId.split('@')[0]}`, [senderId]);
    }
});

cmd({ pattern: "quizscores", alias: ["quizleaderboard"], desc: "Quiz leaderboard", category: "group", react: "🏆", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    const sorted = Object.entries(gd.quizscores || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!sorted.length) return reply("❌ No scores yet!");
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    reply(`🏆 *QUIZ SCORES*\n\n${sorted.map(([jid, p], i) => `${medals[i]} @${jid.split('@')[0]} — ${p} pts`).join('\n')}`, sorted.map(([j]) => j));
});

cmd({ pattern: "resetquiz", alias: ["clearquiz"], desc: "Reset all quiz scores", category: "group", react: "🔄", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { quizscores: {}, activequiz: null });
        reply("✅ Quiz scores reset!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groll", alias: ["grouproll", "randompick"], desc: "Pick a random group member", category: "group", react: "🎲", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        const botNum = conn.user?.id?.replace(/[:@].*/g, '');
        const others = meta.participants.filter(p => !p.id.includes(botNum));
        const picked = others[Math.floor(Math.random() * others.length)];
        reply(`🎲 *RANDOM PICK!*\n\n🎯 @${picked.id.split('@')[0]} 🎉\n_From ${others.length} members!_`, [picked.id]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "gcouple", alias: ["groupcouple", "shipgroup"], desc: "Ship two random group members", category: "group", react: "💘", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const meta = await conn.groupMetadata(from);
        if (meta.participants.length < 2) return reply("❌ Need 2+ members!");
        const s = [...meta.participants].sort(() => Math.random() - 0.5);
        const p1 = s[0]; const p2 = s[1];
        const score = Math.floor(Math.random() * 40) + 61;
        const bar = '█'.repeat(Math.floor(score/10)) + '░'.repeat(10-Math.floor(score/10));
        reply(`💘 *COUPLE OF THE DAY!*\n\n@${p1.id.split('@')[0]} ❤️ @${p2.id.split('@')[0]}\n\n💑 Match: ${score}%\n[${bar}]`, [p1.id, p2.id]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "gslap", alias: ["groupslap"], use: ".gslap @user", desc: "Playfully slap a member", category: "group", react: "👋", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return reply("❌ Tag someone!");
    const m1 = [`💥 @${senderId.split('@')[0]} slapped @${target.split('@')[0]} with a fish! 🐟`,`👋 @${senderId.split('@')[0]} mega-slapped @${target.split('@')[0]}!`,`⚡ @${senderId.split('@')[0]} sent @${target.split('@')[0]} flying! 🌪️`];
    reply(m1[Math.floor(Math.random() * m1.length)], [senderId, target]);
});

cmd({ pattern: "groupjoke", alias: ["gcjoke", "grpjoke"], desc: "Random group joke", category: "group", react: "😂", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const jokes = ["Why do programmers prefer dark mode?\n_Light attracts bugs_ 🐛","Teacher: Name 5 animals.\nStudent: Dog, cat, and 3 more dogs 🐕","Why can't a bicycle stand alone?\nBecause it's two-tired! 🚲","I told my cat a joke.\nHe said nothing. So I said nothing back. 😹","My boss said have a good day.\nSo I went home 🏠"];
    reply(`😂 *JOKE*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`);
});

cmd({ pattern: "grouptaunt", alias: ["tauntgc"], use: ".grouptaunt @user", desc: "Playful taunt", category: "group", react: "😏", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return reply("❌ Tag someone!");
    const ts = [`😏 @${senderId.split('@')[0]} says @${target.split('@')[0]}'s jokes are mid!`,`🤣 @${senderId.split('@')[0]} bets @${target.split('@')[0]} can't do 10 pushups!`,`😜 @${senderId.split('@')[0]} says @${target.split('@')[0]} is the group sleepyhead! 😴`];
    reply(ts[Math.floor(Math.random() * ts.length)], [senderId, target]);
});

// ══════════════════════════════════════════════════════════════════════════════
//  🔧  MEDIA LOCKS  [43-53]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "lockimg", alias: ["noimages", "blockimg"], desc: "Lock image sending in group", category: "group", react: "🚫", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockimg: true });
        reply("🚫 *IMAGES LOCKED!*\n\nNon-admin images will be deleted.");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unlockimg", alias: ["allowimages"], desc: "Unlock image sending", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockimg: false });
        reply("✅ *IMAGES UNLOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "lockvid", alias: ["novideos", "blockvid"], desc: "Lock video sending in group", category: "group", react: "🚫", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockvid: true });
        reply("🚫 *VIDEOS LOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unlockvid", alias: ["allowvideos"], desc: "Unlock video sending", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockvid: false });
        reply("✅ *VIDEOS UNLOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "lockaudio", alias: ["noaudio", "blockaudio"], desc: "Lock audio/voice notes", category: "group", react: "🔇", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockaudio: true });
        reply("🔇 *AUDIO LOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unlockaudio", alias: ["allowaudio"], desc: "Unlock audio sending", category: "group", react: "🔊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockaudio: false });
        reply("🔊 *AUDIO UNLOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "lockdoc", alias: ["nodocs", "blockdoc"], desc: "Lock document sending", category: "group", react: "📵", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockdoc: true });
        reply("📵 *DOCS LOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unlockdoc", alias: ["allowdocs"], desc: "Unlock document sending", category: "group", react: "📄", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { lockdoc: false });
        reply("📄 *DOCS UNLOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "locksticker", alias: ["nostickers"], desc: "Lock sticker sending", category: "group", react: "🚫", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { locksticker: true });
        reply("🚫 *STICKERS LOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unlocksticker", alias: ["allowstickers"], desc: "Unlock sticker sending", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { locksticker: false });
        reply("✅ *STICKERS UNLOCKED!*");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "mediastatus", alias: ["medialocks", "lockstatus"], desc: "View all media lock status", category: "group", react: "📊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        reply(`📊 *MEDIA STATUS*\n\n🖼️ Images: ${gd.lockimg ? '🔒' : '✅'}\n🎥 Videos: ${gd.lockvid ? '🔒' : '✅'}\n🎵 Audio: ${gd.lockaudio ? '🔒' : '✅'}\n📄 Docs: ${gd.lockdoc ? '🔒' : '✅'}\n🎭 Stickers: ${gd.locksticker ? '🔒' : '✅'}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  💬  CUSTOM MESSAGES  [54-63]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "setwelcome", alias: ["customwelcome"], use: ".setwelcome Welcome {user} to {group}!", desc: "Set custom welcome. Use {user} {group}", category: "group", react: "👋", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const msg = args.join(' ');
        if (!msg) return reply("❌ .setwelcome Welcome {user} to {group}!");
        setGD(from, { customwelcome: msg });
        const meta = await conn.groupMetadata(from);
        reply(`✅ *Welcome Set!*\n\nPreview:\n${msg.replace('{user}','@Member').replace('{group}', meta.subject)}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setgoodbye", alias: ["customgoodbye"], use: ".setgoodbye Goodbye {user}!", desc: "Set custom goodbye message", category: "group", react: "👋", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const msg = args.join(' ');
        if (!msg) return reply("❌ .setgoodbye Goodbye {user}!");
        setGD(from, { customgoodbye: msg });
        reply(`✅ *Goodbye Set!*\n\nPreview:\n${msg.replace('{user}','@Member')}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "clearwelcome", alias: ["resetwelcome"], desc: "Reset welcome to default", category: "group", react: "🔄", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { customwelcome: null });
        reply("✅ Welcome reset to default!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setannounce", alias: ["announce", "gcannounce"], use: ".setannounce message", desc: "Send group announcement", category: "group", react: "📣", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const msg = args.join(' ');
        if (!msg) return reply("❌ .setannounce <message>");
        const meta = await conn.groupMetadata(from);
        await conn.sendMessage(from, { text: `📣 *ANNOUNCEMENT — ${meta.subject}*\n\n${msg}\n\n🕐 ${new Date().toLocaleString()}` });
        reply("✅ Announcement sent!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupnote", alias: ["setnote", "gcnote"], use: ".groupnote text", desc: "Save a group note", category: "group", react: "📝", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const note = args.join(' ');
        if (!note) return reply("❌ .groupnote <text>");
        setGD(from, { note });
        reply(`📝 *Note Saved!*\n\nUse .shownote to view.`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "shownote", alias: ["getnote", "note"], desc: "View saved group note", category: "group", react: "📋", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.note) return reply("❌ No note! Admins use .groupnote");
    reply(`📋 *GROUP NOTE*\n\n${gd.note}`);
});

cmd({ pattern: "clearnote", alias: ["delnote"], desc: "Clear group note", category: "group", react: "🗑️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { note: null });
        reply("✅ Note cleared!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "grouptopic", alias: ["topic", "gctopic"], use: ".grouptopic Today: Python vs JS", desc: "Set a discussion topic", category: "group", react: "💬", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const topic = args.join(' ');
        if (!topic) return reply("❌ .grouptopic <topic>");
        setGD(from, { topic });
        reply(`💬 *TOPIC SET!*\n\n📌 _${topic}_`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "showtopic", alias: ["gettopic"], desc: "Show current discussion topic", category: "group", react: "💬", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.topic) return reply("❌ No topic! Use .grouptopic");
    reply(`💬 *TOPIC*\n\n📌 ${gd.topic}`);
});

cmd({ pattern: "groupmotd", alias: ["motd"], use: ".groupmotd message", desc: "Set message of the day", category: "group", react: "☀️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const msg = args.join(' ');
        if (!msg) return reply("❌ .groupmotd <message>");
        setGD(from, { motd: msg, motddate: new Date().toDateString() });
        reply(`☀️ *MOTD SET!*\n\n📅 ${new Date().toDateString()}\n_${msg}_`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🔨  MODERATION  [64-80]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "softban", alias: ["kickreadd"], use: ".softban @user", desc: "Kick then re-add a user", category: "group", react: "🔨", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        setTimeout(async () => { try { await conn.groupParticipantsUpdate(from, [target], 'add'); } catch {} }, 3000);
        reply(`🔨 @${target.split('@')[0]} soft-banned (kick + re-add).`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "muteuser", alias: ["silenceuser"], use: ".muteuser @user", desc: "Mute a user (bot-tracked)", category: "group", react: "🔇", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.mutedusers) gd.mutedusers = [];
        if (gd.mutedusers.includes(target)) return reply("❌ Already muted!");
        gd.mutedusers.push(target); setGD(from, gd);
        reply(`🔇 @${target.split('@')[0]} muted!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unmuteuser", alias: ["silenceoff"], use: ".unmuteuser @user", desc: "Unmute a user", category: "group", react: "🔊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.mutedusers) gd.mutedusers = [];
        const idx = gd.mutedusers.indexOf(target);
        if (idx === -1) return reply("❌ Not muted!");
        gd.mutedusers.splice(idx, 1); setGD(from, gd);
        reply(`🔊 @${target.split('@')[0]} unmuted!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "mutelist", alias: ["listmuted"], desc: "Show all muted users", category: "group", react: "🔇", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        const muted = gd.mutedusers || [];
        if (!muted.length) return reply("✅ No muted users!");
        reply(`🔇 *MUTED*\n\n${muted.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n')}`, muted);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "kickall", alias: ["cleargroup2"], desc: "Kick all non-admin members", category: "group", react: "🔴", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const meta = await conn.groupMetadata(from);
        const botNum = conn.user?.id?.replace(/[:@].*/g, '');
        const nonAdmins = meta.participants.filter(p => !p.admin && !p.id.includes(botNum));
        if (!nonAdmins.length) return reply("❌ No regular members!");
        reply(`⏳ Kicking ${nonAdmins.length}...`);
        for (const p of nonAdmins) { try { await conn.groupParticipantsUpdate(from, [p.id], 'remove'); await new Promise(r => setTimeout(r, 400)); } catch {} }
        reply(`✅ Done! Kicked ${nonAdmins.length}.`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "kickbots", alias: ["removebots"], desc: "Kick suspected bots from group", category: "group", react: "🤖", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const meta = await conn.groupMetadata(from);
        const botNum = conn.user?.id?.replace(/[:@].*/g, '');
        const bots = meta.participants.filter(p => { const n = p.id.split('@')[0]; return n.length > 15 && !p.id.includes(botNum); });
        if (!bots.length) return reply("✅ No bots detected!");
        for (const b of bots) { try { await conn.groupParticipantsUpdate(from, [b.id], 'remove'); } catch {} }
        reply(`✅ Removed ${bots.length} bot(s)!`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "tempkick", alias: ["timedkick"], use: ".tempkick @user 10", desc: "Kick user for X minutes then re-add", category: "group", react: "⏰", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const mins = parseInt(args[1] || args[0]) || 5;
        if (!target) return reply("❌ .tempkick @user [minutes]");
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        reply(`⏰ @${target.split('@')[0]} kicked for ${mins}min. Will be re-added.`, [target]);
        setTimeout(async () => { try { await conn.groupParticipantsUpdate(from, [target], 'add'); await conn.sendMessage(from, { text: `✅ @${target.split('@')[0]} re-added after ${mins}min.`, mentions: [target] }); } catch {} }, mins * 60 * 1000);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "demoteall", alias: ["removeallpromote"], desc: "Demote all non-owner admins", category: "group", react: "⬇️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const meta = await conn.groupMetadata(from);
        const botNum = conn.user?.id?.replace(/[:@].*/g, '');
        const admins = meta.participants.filter(p => p.admin === 'admin' && !p.id.includes(botNum));
        if (!admins.length) return reply("❌ No admins to demote!");
        for (const a of admins) { try { await conn.groupParticipantsUpdate(from, [a.id], 'demote'); } catch {} }
        reply(`✅ Demoted ${admins.length}!`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupreport", alias: ["report2", "gcreport"], use: ".groupreport @user [reason]", desc: "Report member to admins", category: "group", react: "🚨", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag someone!");
        const reason = args.slice(1).join(' ') || 'No reason';
        const meta = await conn.groupMetadata(from);
        const admins = meta.participants.filter(p => p.admin).map(p => p.id);
        await conn.sendMessage(from, { text: `🚨 *REPORT*\n\n👤 @${target.split('@')[0]}\n👮 By: @${senderId.split('@')[0]}\n📝 ${reason}`, mentions: [target, senderId, ...admins] });
        reply("✅ Report sent to admins!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupblacklist", alias: ["gcblacklist", "blacklist"], use: ".groupblacklist @user", desc: "Blacklist a member", category: "group", react: "⛔", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.blacklist) gd.blacklist = [];
        if (gd.blacklist.includes(target)) return reply("❌ Already blacklisted!");
        gd.blacklist.push(target); setGD(from, gd);
        reply(`⛔ @${target.split('@')[0]} blacklisted!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "ungroupblacklist", alias: ["gcunblacklist", "unblacklist"], use: ".ungroupblacklist @user", desc: "Remove from blacklist", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.blacklist) gd.blacklist = [];
        const idx = gd.blacklist.indexOf(target);
        if (idx === -1) return reply("❌ Not blacklisted!");
        gd.blacklist.splice(idx, 1); setGD(from, gd);
        reply(`✅ @${target.split('@')[0]} unblacklisted!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "showblacklist", alias: ["listblacklist"], desc: "Show group blacklist", category: "group", react: "⛔", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const gd = getGD(from);
        const bl = gd.blacklist || [];
        if (!bl.length) return reply("✅ Blacklist empty!");
        reply(`⛔ *BLACKLIST*\n\n${bl.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n')}`, bl);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "unfreeze", alias: ["unfreezegc", "thaw"], desc: "Unfreeze group — all can chat", category: "group", react: "🔥", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        await conn.groupSettingUpdate(from, 'not_announcement');
        setGD(from, { frozen: false });
        reply("🔥 *UNFROZEN!*\n\nEveryone can chat again!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setgroupname", alias: ["renamegc", "gcname"], use: ".setgroupname New Name", desc: "Change group name", category: "group", react: "✏️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const name = args.join(' ');
        if (!name) return reply("❌ .setgroupname <name>");
        await conn.groupUpdateSubject(from, name);
        reply(`✅ Group renamed to "*${name}*"!`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setgroupdesc", alias: ["gcsetdesc"], use: ".setgroupdesc New description", desc: "Change group description", category: "group", react: "📝", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const desc = args.join(' ');
        if (!desc) return reply("❌ .setgroupdesc <description>");
        await conn.groupUpdateDescription(from, desc);
        reply("✅ Description updated!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🎁  POINTS SYSTEM  [81-90]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "givepoints", alias: ["addpoints", "award"], use: ".givepoints @user 10", desc: "Give points to a member", category: "group", react: "⭐", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const pts = parseInt(args[1] || args[0]) || 10;
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.points) gd.points = {};
        gd.points[target] = (gd.points[target] || 0) + pts; setGD(from, gd);
        reply(`⭐ @${target.split('@')[0]} +${pts} pts! Total: ${gd.points[target]}`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "takepoints", alias: ["deductpoints"], use: ".takepoints @user 5", desc: "Deduct points from member", category: "group", react: "⬇️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const pts = parseInt(args[1] || args[0]) || 5;
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.points) gd.points = {};
        gd.points[target] = Math.max(0, (gd.points[target] || 0) - pts); setGD(from, gd);
        reply(`⬇️ @${target.split('@')[0]} -${pts} pts! Remaining: ${gd.points[target]}`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "mypoints", alias: ["checkpoints"], desc: "Check your group points", category: "group", react: "💎", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const gd = getGD(from);
    const pts = gd.points?.[senderId] || 0;
    const sorted = Object.entries(gd.points || {}).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([j]) => j === senderId) + 1;
    reply(`💎 *MY POINTS*\n\n👤 @${senderId.split('@')[0]}\n⭐ ${pts} pts\n🏆 Rank: #${rank || 'N/A'}`, [senderId]);
});

cmd({ pattern: "pointsboard", alias: ["leaderboard2", "toppoints"], desc: "Points leaderboard", category: "group", react: "🏆", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    const sorted = Object.entries(gd.points || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!sorted.length) return reply("❌ No points yet!");
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    reply(`🏆 *POINTS BOARD*\n\n${sorted.map(([jid, p], i) => `${medals[i]} @${jid.split('@')[0]} — ⭐ ${p}`).join('\n')}`, sorted.map(([j]) => j));
});

cmd({ pattern: "resetpoints", alias: ["clearpoints"], desc: "Reset all group points", category: "group", react: "🔄", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        setGD(from, { points: {} });
        reply("✅ Points reset!");
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "dailyreward", alias: ["daily", "claimdaily"], desc: "Claim daily reward points", category: "group", react: "🎁", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const gd = getGD(from);
    if (!gd.daily) gd.daily = {};
    if (!gd.points) gd.points = {};
    const last = gd.daily[senderId] || 0;
    const cd = 24 * 60 * 60 * 1000;
    if (Date.now() - last < cd) {
        const h = Math.ceil((cd - (Date.now() - last)) / 3600000);
        return reply(`❌ Already claimed!\n⏳ Come back in ${h}h`);
    }
    const reward = Math.floor(Math.random() * 50) + 10;
    gd.daily[senderId] = Date.now();
    gd.points[senderId] = (gd.points[senderId] || 0) + reward;
    setGD(from, gd);
    reply(`🎁 *DAILY CLAIMED!*\n\n💰 @${senderId.split('@')[0]} got *${reward}pts*!\n⭐ Total: ${gd.points[senderId]}`, [senderId]);
});

cmd({ pattern: "grouptag2", alias: ["tagall2"], use: ".grouptag2 [msg]", desc: "Tag all members with message", category: "group", react: "📣", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const message = args.join(' ') || 'Attention!';
        const meta = await conn.groupMetadata(from);
        const members = meta.participants.map(p => p.id);
        const mentions = members.map(id => `@${id.split('@')[0]}`).join(' ');
        await conn.sendMessage(from, { text: `📣 *${message}*\n\n${mentions}`, mentions: members });
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "grouppoll2", alias: ["advpoll"], use: ".grouppoll2 Q? | A | B | C", desc: "Create a multi-option poll", category: "group", react: "📊", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const parts = args.join(' ').split('|').map(p => p.trim());
        if (parts.length < 3) return reply("❌ .grouppoll2 Q? | A | B | C");
        const [question, ...options] = parts;
        const gd = getGD(from);
        gd.activepoll = { question, options, votes: {} }; setGD(from, gd);
        const letters = ['A','B','C','D','E'];
        reply(`📊 *POLL*\n\n❓ *${question}*\n\n${options.map((o, i) => `${letters[i]}. ${o}`).join('\n')}\n\n_Use .pollvote A/B/C_`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "pollvote", alias: ["vote"], use: ".pollvote A", desc: "Vote in active poll", category: "group", react: "✅", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const senderId = getSender(mek, conn);
    const gd = getGD(from);
    if (!gd.activepoll) return reply("❌ No poll! Use .grouppoll2");
    const choice = args[0]?.toUpperCase();
    const idx = ['A','B','C','D','E'].indexOf(choice);
    if (idx === -1 || idx >= gd.activepoll.options.length) return reply("❌ Invalid choice!");
    gd.activepoll.votes[senderId] = idx; setGD(from, gd);
    reply(`✅ @${senderId.split('@')[0]} voted: *${choice}. ${gd.activepoll.options[idx]}*`, [senderId]);
});

cmd({ pattern: "pollresults", alias: ["voteresults"], desc: "Show poll results", category: "group", react: "📊", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.activepoll) return reply("❌ No poll!");
    const { question, options, votes } = gd.activepoll;
    const total = Object.keys(votes).length || 1;
    const bars = options.map((o, i) => {
        const c = Object.values(votes).filter(v => v === i).length;
        const pct = Math.round((c / total) * 100);
        return `${'ABCDE'[i]}. ${o}\n[${'█'.repeat(Math.floor(pct/10))}${'░'.repeat(10-Math.floor(pct/10))}] ${pct}% (${c})`;
    }).join('\n\n');
    reply(`📊 *RESULTS*\n\n❓ ${question}\n\n${bars}\n\nVotes: ${Object.keys(votes).length}`);
});

// ══════════════════════════════════════════════════════════════════════════════
//  🔔  MISC TOOLS  [91-100]
// ══════════════════════════════════════════════════════════════════════════════

cmd({ pattern: "groupreminder", alias: ["reminder", "gcreminder"], use: ".groupreminder 5 message", desc: "Set a timed group reminder", category: "group", react: "⏰", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const mins = parseInt(args[0]);
        const msg = args.slice(1).join(' ');
        if (!mins || !msg) return reply("❌ .groupreminder 5 Meeting start!");
        reply(`✅ Reminder in ${mins}min!`);
        setTimeout(() => conn.sendMessage(from, { text: `⏰ *REMINDER!*\n\n${msg}` }), mins * 60 * 1000);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupcountdown", alias: ["countdown", "gccountdown"], use: ".groupcountdown 10 Event!", desc: "Live countdown (max 30s)", category: "group", react: "⏳", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const secs = Math.min(parseInt(args[0]) || 5, 30);
        const event = args.slice(1).join(' ') || 'Go!';
        reply(`⏳ Starting countdown: *${event}*`);
        for (let i = secs; i > 0; i--) {
            await new Promise(r => setTimeout(r, 1000));
            if (i <= 5 || i % 5 === 0) await conn.sendMessage(from, { text: `⏳ *${i}...*` });
        }
        await conn.sendMessage(from, { text: `🎉 *${event.toUpperCase()}!* 🎉` });
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupvip", alias: ["setvip", "gcvip"], use: ".groupvip @user", desc: "Give VIP to a member", category: "group", react: "💎", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.vip) gd.vip = [];
        if (gd.vip.includes(target)) return reply("❌ Already VIP!");
        gd.vip.push(target); setGD(from, gd);
        reply(`💎 @${target.split('@')[0]} is now VIP!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "removevip", alias: ["unvip"], use: ".removevip @user", desc: "Remove VIP status", category: "group", react: "⬇️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const target = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return reply("❌ Tag a user!");
        const gd = getGD(from);
        if (!gd.vip) gd.vip = [];
        const idx = gd.vip.indexOf(target);
        if (idx === -1) return reply("❌ Not VIP!");
        gd.vip.splice(idx, 1); setGD(from, gd);
        reply(`✅ VIP removed from @${target.split('@')[0]}!`, [target]);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "showvip", alias: ["listvip"], desc: "Show all VIP members", category: "group", react: "💎", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    const vips = gd.vip || [];
    if (!vips.length) return reply("❌ No VIPs!");
    reply(`💎 *VIP MEMBERS*\n\n${vips.map((j, i) => `${i+1}. 💎 @${j.split('@')[0]}`).join('\n')}`, vips);
});

cmd({ pattern: "groupmood", alias: ["setmood", "gcmood"], use: ".groupmood 🎉 Party time!", desc: "Set group mood/vibe", category: "group", react: "🎭", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const mood = args.join(' ');
        if (!mood) return reply("❌ .groupmood <emoji + text>");
        setGD(from, { mood, mooddate: new Date().toDateString() });
        reply(`🎭 *MOOD SET!*\n\n${mood}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "showmood", alias: ["gcvibes"], desc: "Show current group mood", category: "group", react: "🎭", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.mood) return reply("❌ No mood! Use .groupmood");
    reply(`🎭 *GROUP MOOD*\n\n${gd.mood}\n📅 ${gd.mooddate || 'Today'}`);
});

cmd({ pattern: "groupevent2", alias: ["event2", "setevent"], use: ".groupevent2 Name | Date | Details", desc: "Create a group event", category: "group", react: "🎉", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const parts = args.join(' ').split('|').map(p => p.trim());
        if (parts.length < 2) return reply("❌ .groupevent2 Name | Date | Details");
        const [name, date, desc = 'Join us!'] = parts;
        setGD(from, { event: { name, date, desc } });
        reply(`🎉 *EVENT CREATED!*\n\n📌 *${name}*\n📅 ${date}\n📝 ${desc}`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "showevent", alias: ["nextevent"], desc: "Show current group event", category: "group", react: "🎉", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.event) return reply("❌ No event! Use .groupevent2");
    const { name, date, desc } = gd.event;
    reply(`🎉 *EVENT*\n\n📌 ${name}\n📅 ${date}\n📝 ${desc}`);
});

cmd({ pattern: "showmotd", alias: ["getmotd", "todaymsg"], desc: "Show today's group message of the day", category: "group", react: "☀️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    if (!isGroup) return reply("❌ Group only!");
    const gd = getGD(from);
    if (!gd.motd) return reply("❌ No MOTD! Admins use .groupmotd");
    reply(`☀️ *MESSAGE OF THE DAY*\n\n📅 ${gd.motddate || 'Today'}\n\n_${gd.motd}_`);
});

cmd({ pattern: "promoteall", alias: ["allasadmins", "makeallpromote"], desc: "Promote all regular members to admin", category: "group", react: "⬆️", filename: __filename },
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isBotAdmin) return reply("❌ Bot must be admin!");
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const meta = await conn.groupMetadata(from);
        const nonAdmins = meta.participants.filter(p => !p.admin);
        if (!nonAdmins.length) return reply("❌ All are already admins!");
        for (const p of nonAdmins) { try { await conn.groupParticipantsUpdate(from, [p.id], 'promote'); await new Promise(r=>setTimeout(r,300)); } catch {} }
        reply(`✅ Promoted ${nonAdmins.length} member(s)!`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "setmsgcooldown", alias: ["slowmode", "msgcooldown"], use: ".setmsgcooldown 10", desc: "Set message cooldown in seconds (slowmode)", category: "group", react: "⏱️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        const secs = parseInt(args[0]);
        if (isNaN(secs)) return reply("❌ Usage: .setmsgcooldown 10 (or 0 to disable)");
        setGD(from, { cooldown: secs });
        reply(`⏱️ *COOLDOWN ${secs === 0 ? 'DISABLED' : `SET: ${secs}s`}*`);
    } catch (e) { reply('❌ Error: ' + e.message); }
});

cmd({ pattern: "groupwipe", alias: ["wipegcdata"], desc: "⚠️ Reset ALL bot data for this group", category: "group", react: "⚠️", filename: __filename },
async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group only!");
        const senderId = getSender(mek, conn);
        const { isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        if (!isSenderAdmin) return reply("❌ Admins only!");
        if (args[0] !== 'confirm') return reply("⚠️ *DANGER!*\n\nThis deletes:\n• Warns, Points, Rules\n• Settings, Blacklist\n\nType *.groupwipe confirm* to proceed!");
        const db = loadDB(); delete db[from]; saveDB(db);
        reply("✅ All group data wiped! Fresh start 🔄");
    } catch (e) { reply('❌ Error: ' + e.message); }
});
