


const CommandHandler = require('../lib/commandHandler');
const settings = require("../settings");

module.exports = {
  command: 'perf',
  aliases: ['metrics', 'diagnostics'],
  category: 'general',
  description: 'View command performance and error metrics',
  usage: '.perf',
  ownerOnly: 'true',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const report = CommandHandler.getDiagnostics();
      
      if (!report || report.length === 0) {
        return await sock.sendMessage(chatId, { text: '_No performance data collected yet._' }, { quoted: message });
      }

      let text = `📊 *PLUGINS PERFORMANCE*\n\n`;
      
      report.forEach((cmd, index) => {
        const errorText = cmd.errors > 0 ? `❗ Errors: ${cmd.errors}` : `✅ Smooth`;
        text += `${index + 1}. *${cmd.command.toUpperCase()}*\n`;
        text += `   ↳ Calls: ${cmd.usage}\n`;
        text += `   ↳ Latency: ${cmd.average_speed}\n`;
        text += `   ↳ Status: ${errorText}\n\n`;
      });

      await sock.sendMessage(chatId, {
        text: text.trim(),
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363421104812135@newsletter',
            newsletterName: 'Teddy Tech',
            serverMessageId: -1
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error('Error in perf command:', error);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch performance metrics.' }, { quoted: message });
    }
  }
};

