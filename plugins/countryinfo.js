const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "country",
  alias: ["countryinfo", "nation"],
  desc: "Get information about a country",
  category: "tools",
  use: ".country <name>",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  const countryName = args.join(" ");
  if (!countryName) return reply("🌍 Please enter a country name.\n\nExample: *.country Indonesia*");

  try {
    // Fetch data from API
    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/tools/countryInfo?name=${encodeURIComponent(countryName)}`;
    const res = await axios.get(apiUrl);

    if (!res.data.status || !res.data.data) {
      return reply("❌ No information found for that country.");
    }

    const c = res.data.data;
    const caption = `🌍 *Country Information: ${c.name}*\n
🏛️ *Capital:* ${c.capital}
📍 *Continent:* ${c.continent.name} ${c.continent.emoji}
📞 *Phone Code:* ${c.phoneCode}
💰 *Currency:* ${c.currency}
🚗 *Driving Side:* ${c.drivingSide}
🗺️ *Area:* ${c.area.squareKilometers.toLocaleString()} km²
🌐 *TLD:* ${c.internetTLD}
📦 *Constitutional Form:* ${c.constitutionalForm}
🦎 *Famous For:* ${c.famousFor}

🗺️ *Google Maps:* ${c.googleMapsLink}

🌎 *Languages:* ${c.languages.native.join(", ")}
🌍 *ISO Codes:* ${c.isoCode.alpha2.toUpperCase()} / ${c.isoCode.alpha3.toUpperCase()}
`;

    // Send flag image + caption
    await conn.sendMessage(mek.chat, {
      image: { url: c.flag },
      caption: caption
    }, { quoted: mek });

  } catch (err) {
    console.error("❌ Error fetching country info:", err.message);
    reply("❌ *Failed to connect to API.* Please try again later.");
  }
});
