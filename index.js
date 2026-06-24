///Copyright © Teddy Tech 

require('dotenv').config();
require('./settings');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    Browsers,
    delay
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics');
const { rmSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Mega.js for session download
const { File } = require('megajs');
const express = require("express");

const store = require('./lib/lightweight_store');
store.readFromFile();
const settings = require('./settings');

setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection completed');
    }
}, 60_000);

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...');
        process.exit(1);
    }
}, 30_000);

global.botname = settings.botName || "Teddy-X";
global.themeemoji = "•";

// Set global SESSION_ID from settings
global.SESSION_ID = settings.SESSION_ID || '';

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

// Teddy_Sessions System Start
if (!fs.existsSync('./Teddy_Sessions')) {
    fs.mkdirSync('./Teddy_Sessions', { recursive: true });
    console.log(chalk.green('📁 Created Teddy_Sessions directory'));
}

async function downloadSessionFromMega() {
    return new Promise((resolve, reject) => {
        if (!global.SESSION_ID) {
            console.log(chalk.yellow('⚠️  No SESSION_ID provided in settings.js'));
            console.log(chalk.yellow('Will use QR code for authentication'));
            resolve(false);
            return;
        }

        console.log(chalk.blue('📥 Downloading Teddy_Sessions from mega.nz...'));
        try {
            const sessdata = global.SESSION_ID.replace("Teddy-xmd:~", '');
            const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
            
            filer.download((err, data) => {
                if (err) {
                    console.log(chalk.red('❌ Error downloading session:'));
                    console.error(err);
                    console.log(chalk.yellow('Will use QR code for authentication'));
                    resolve(false);
                    return;
                }
                
                fs.writeFile('./Teddy_Sessions/creds.json', data, (writeErr) => {
                    if (writeErr) {
                        console.log(chalk.red('❌ Error saving session file:'));
                        console.error(writeErr);
                        resolve(false);
                        return;
                    }
                    
                    console.log(chalk.green('✅ Teddy_Sessions downloaded successfully'));
                    resolve(true);
                });
            });
        } catch (error) {
            console.log(chalk.red('❌ Error initializing mega download:'));
            console.error(error);
            resolve(false);
        }
    });
}

async function checkAndDownloadSession() {
    if (!fs.existsSync('./Teddy_Sessions/creds.json')) {
        const downloaded = await downloadSessionFromMega();
        if (downloaded) {
            console.log(chalk.green('✅ Session ready, starting bot...'));
        } else {
            console.log(chalk.yellow('⚠️  No session file, will show QR code...'));
        }
    } else {
        console.log(chalk.green('✅ Session file already exists'));
    }
    
    // Start Express server
    startExpressServer();
    
    // Start the bot
    startHansTechInc();
}

// Express server setup
function startExpressServer() {
    const app = express();
    const PORT = process.env.PORT || 9090;

    // Serve index.html
    app.get('/index.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.get("/", (req, res) => res.send(`${settings.botName} WhatsApp Bot`));
    app.get("/status", (req, res) => res.json({ 
        status: "online", 
        bot: settings.botName,
        version: settings.version,
        owner: settings.botOwner
    }));
    
    app.listen(PORT, () => console.log(chalk.blue(`🌐 Web server running on port ${PORT}`)));
}

async function startHansTechInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('./Teddy_Sessions');
        
        const msgRetryCounterCache = new NodeCache();

        const HansTechInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !fs.existsSync('./Teddy_Sessions/creds.json'),
            browser: Browsers.macOS('Desktop'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid);
                let msg = await store.loadMessage(jid, key.id);
                return msg?.message || "";
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        // Save credentials when they update
        HansTechInc.ev.on('creds.update', saveCreds);

        store.bind(HansTechInc.ev);

        // Message handling
        HansTechInc.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(HansTechInc, chatUpdate);
                    return;
                }
                if (!HansTechInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us');
                    if (!isGroup) return;
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

                if (HansTechInc?.msgRetryCounterCache) {
                    HansTechInc.msgRetryCounterCache.clear();
                }

                try {
                    await handleMessages(HansTechInc, chatUpdate, true);
                } catch (err) {
                    console.error("Error in handleMessages:", err);
                    if (mek.key && mek.key.remoteJid) {
                        await HansTechInc.sendMessage(mek.key.remoteJid, {
                            text: '❌ An error occurred while processing your message.',
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363406146813524@newsletter',
                                    newsletterName: 'Teddy-X',
                                    serverMessageId: -1
                                }
                            }
                        }).catch(console.error);
                    }
                }
            } catch (err) {
                console.error("Error in messages.upsert:", err);
            }
        });

        HansTechInc.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        HansTechInc.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = HansTechInc.decodeJid(contact.id);
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
            }
        });

        HansTechInc.getName = (jid, withoutContact = false) => {
            id = HansTechInc.decodeJid(jid);
            withoutContact = HansTechInc.withoutContact || withoutContact;
            let v;
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = HansTechInc.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
            else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === HansTechInc.decodeJid(HansTechInc.user.id) ?
                HansTechInc.user :
                (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        };

        HansTechInc.public = true;

        HansTechInc.serializeM = (m) => smsg(HansTechInc, m, store);

        // Connection handling
        HansTechInc.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s;
            
            if (qr) {
                console.log(chalk.yellow('📱 QR Code generated. Please scan with WhatsApp.'));
            }
            
            if (connection === 'connecting') {
                console.log(chalk.yellow('🔄 Connecting to WhatsApp...'));
            }
            
            if (connection == "open") {
                console.log(chalk.magenta(` `));
                console.log(chalk.green(`✅ Connected successfully to WhatsApp`));
                console.log(chalk.yellow(`👤 User: ${HansTechInc.user?.name || 'Unknown'}`));
                console.log(chalk.yellow(`📱 Number: ${HansTechInc.user?.id?.split(':')[0] || 'Unknown'}`));

                try {
                    const botNumber = HansTechInc.user.id.split(':')[0] + '@s.whatsapp.net';
                    await HansTechInc.sendMessage(botNumber, {
                        text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n👤 User: ${HansTechInc.user?.name || 'Unknown'}\n📱 Session: ${global.SESSION_ID ? 'Mega.nz Session' : 'QR Code'}`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363406146813524@newsletter',
                                newsletterName: 'Teddy-X',
                                serverMessageId: -1
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error sending connection message:', error.message);
                }

                await delay(1999);
                console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'Teddy-X'} ]`)}\n\n`));
                console.log(chalk.cyan(`< ================================================== >`));
                console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: TIMNASA`));
                console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: timnasax`));
                console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${settings.ownerNumber}`));
                console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: HansTz`));
                console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`));
                console.log(chalk.blue(`Bot Version: ${settings.version}`));
                console.log(chalk.green(`✅ Connected using ${global.SESSION_ID ? 'mega.nz session' : 'QR code'}`));
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                console.log(chalk.red(`Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`));
                
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try {
                        rmSync('./Teddy_Sessions', { recursive: true, force: true });
                        console.log(chalk.yellow('🗑️  Teddy_Sessions folder deleted.'));
                        console.log(chalk.yellow('Please upload new creds.json to mega.nz and update SESSION_ID in settings.js'));
                    } catch (error) {
                        console.error('Error deleting session:', error);
                    }
                    console.log(chalk.red('Session logged out. Please update SESSION_ID in settings.js'));
                }
                
                if (shouldReconnect) {
                    console.log(chalk.yellow('Reconnecting in 5 seconds...'));
                    await delay(5000);
                    startHansTechInc();
                }
            }
        });

        const antiCallNotified = new Set();

        HansTechInc.ev.on('call', async (calls) => {
            try {
                const { readState: readAnticallState } = require('./commands/anticall');
                const state = readAnticallState();
                if (!state.enabled) return;
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId;
                    if (!callerJid) continue;
                    try {
                        try {
                            if (typeof HansTechInc.rejectCall === 'function' && call.id) {
                                await HansTechInc.rejectCall(call.id, callerJid);
                            } else if (typeof HansTechInc.sendCallOfferAck === 'function' && call.id) {
                                await HansTechInc.sendCallOfferAck(call.id, callerJid, 'reject');
                            }
                        } catch {}

                        if (!antiCallNotified.has(callerJid)) {
                            antiCallNotified.add(callerJid);
                            setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                            await HansTechInc.sendMessage(callerJid, { text: '> _📵 Anticall is enabled. Your call was rejected by vortex xmd bot and you will be blocked_' });
                        }
                    } catch {}
                    setTimeout(async () => {
                        try { await HansTechInc.updateBlockStatus(callerJid, 'block'); } catch {}
                    }, 800);
                }
            } catch (e) {}
        });

        HansTechInc.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(HansTechInc, update);
        });

        HansTechInc.ev.on('messages.upsert', async (m) => {
            if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
                await handleStatus(HansTechInc, m);
            }
        });

        HansTechInc.ev.on('status.update', async (status) => {
            await handleStatus(HansTechInc, status);
        });

        HansTechInc.ev.on('messages.reaction', async (status) => {
            await handleStatus(HansTechInc, status);
        });

        return HansTechInc;
    } catch (error) {
        console.error('Error in startHansTechInc:', error);
        console.log(chalk.yellow('Reconnecting in 5 seconds...'));
        await delay(5000);
        startHansTechInc();
    }
}

// Start the session system
console.log(chalk.blue('🚀 Starting Teddy-x Bot...'));
console.log(chalk.blue('🔐 Initializing mega.nz session system...'));

// Clean start - remove old session if needed
if (process.argv.includes('--clean')) {
    if (existsSync('./Teddy_Sessions')) {
        console.log(chalk.yellow('🗑️  Cleaning old session...'));
        rmSync('./Teddy_Sessions', { recursive: true, force: true });
    }
}

checkAndDownloadSession().catch(error => {
    console.error('Fatal error in session system:', error);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});
///Copyright © Teddy Tech 