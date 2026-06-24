///Copyright © Teddy Tech 
const settings = {
packname: process.env.PACK_NAME || 'Teddy',
  
author: process.env.AUTHOR || 'Teddy',
  
SESSION_ID: process.env.SESSION_ID || '', ///PASTE YOUR SESSION ID HERE "Teddy-xmd:~"
  
botName: process.env.BOT_NAME || "TEDDY-XMD",
  
botOwner: process.env.BOT_OWNER || 'Teddy',

Botprefix: process.env.PREFIX || '.',
  
ownerNumber: process.env.OWNER_NUMBER || '254799963583',
  
giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  
commandMode: process.env.COMMAND_MODE || "public",
  
maxStoreMessages: parseInt(process.env.MAX_STORE_MESSAGES) || 20,
  
storeWriteInterval: parseInt(process.env.STORE_WRITE_INTERVAL) || 10000,
  
description: process.env.BOT_DESCRIPTION || "This is a bot for managing group commands and automating tasks.",
  
version: process.env.BOT_VERSION || "2.0.0",
  
updateZipUrl: process.env.UPDATE_ZIP_URL || "https://github.com/Teddytech1/TEDDY-XMD/archive/refs/heads/main.zip",
};

module.exports = settings;

///Copyright © Teddy Tech 