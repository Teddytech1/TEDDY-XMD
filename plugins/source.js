


const axios = require('axios');

module.exports = {
  command: 'getpage',
  aliases: ['source', 'viewsource'],
  category: 'tools',
  description: 'Get the raw HTML source of a website',
  usage: '.getpage <url>',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      return await sock.sendMessage(chatId, { text: 'Provide a valid URL (include http/https).' }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { text: '🌐 *Fetching source code...*' });
      
      const res = await axios.get(url);
      const html = res.data;
      const buffer = Buffer.from(html, 'utf-8');

      await sock.sendMessage(chatId, { 
        document: buffer, 
        mimetype: 'text/html', 
        fileName: 'source.html',
        caption: `*Source code for:* ${url}`
      }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch source. The site might be protected.' });
    }
  }
};

