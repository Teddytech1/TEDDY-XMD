/*by supreme*/
const os = require('os');
const settings = require('../settings.js');

async function pingCommand( sock, chatId ) {
  try {
    const start = Date.now();
    const sentMsg = await sock.sendMessage(chatId, {
      text: '*🔹pong!...*'
    });

    const ping = Date.now() - start;
    const response = `*🔸 Teddy xmd 𝑺𝒑𝒆𝒆𝒅:${ping} 𝒎𝑺*`;

    await sock.sendMessage(chatId, {
      text: response,
      edit: sentMsg.key// Edit the original message
    });
  } catch (error) {
    console.error('Ping error:', error);
    await sock.sendMessage(chatId, { text: 'Failed to measure speed.' });
  }
}

module.exports = pingCommand;


















