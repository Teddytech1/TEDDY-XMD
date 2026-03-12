const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "simdata",
    alias: ["checknum", "siminfo", "numinfo"],
    desc: "Check Pakistani SIM card data",
    category: "tools",
    react: "📱",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) {
            await conn.sendMessage(from, { 
                text: "Please provide a Pakistani phone number.\nExample: `.simdata 03427582213` or `.simdata 923427582213`" 
            }, { quoted: mek });
            return;
        }

        // Clean and format the number to the 03xx... format
        let number = q.replace(/[^0-9]/g, '');
        
        // Convert 923xx format to 03xx
        if (number.startsWith('92')) {
            number = '0' + number.substring(2);
        }
        
        // Validate Pakistani number (must be 11 digits and start with 0)
        if (!number.startsWith('0') || number.length !== 11) {
            await conn.sendMessage(from, { 
                text: "❌ Invalid Pakistani number format.\nPlease use: 923346690239" 
            }, { quoted: mek });
            return;
        }

        const apiUrl = `https://fam-official.serv00.net/api/database.php?number=${number}`;
        
        // React to show the process has started
        await conn.sendMessage(from, { 
            react: { text: "⏳", key: mek.key } 
        });
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;

        // Check if the API call was successful
        if (!data.success) {
            await conn.sendMessage(from, { 
                react: { text: "❌", key: mek.key } 
            });
            await conn.sendMessage(from, { 
                text: "❌ Failed to fetch data. The number might not be in the database." 
            }, { quoted: mek });
            return;
        }

        // Check if the data array exists and has items
        if (!data.data || data.data.length === 0) {
            await conn.sendMessage(from, { 
                react: { text: "❌", key: mek.key } 
            });
            await conn.sendMessage(from, { 
                text: "❌ No information found for this number." 
            }, { quoted: mek });
            return;
        }

        // Format the response
        let responseMessage = `📱 *SIM DATA INFORMATION*\n\n`;
        responseMessage += `📞 *Number:* ${number}\n\n`;

        // Loop through each result in the data array
        data.data.forEach((entry, index) => {
            responseMessage += `━━━ *Result ${index + 1}* ━━━\n`;
            
            if (entry.name && entry.name.trim() !== '') {
                responseMessage += `👤 *Name:* ${entry.name}\n`;
            }
            if (entry.cnic && entry.cnic.trim() !== '') {
                responseMessage += `🪪 *CNIC:* ${entry.cnic}\n`;
            }
            if (entry.address && entry.address.trim() !== '') {
                responseMessage += `📍 *Address:* ${entry.address}\n`;
            }
            responseMessage += `\n`;
        });

        responseMessage += `💳 *Credit:* ${data.credit}`;

        // Send the response message
        await conn.sendMessage(from, { 
            text: responseMessage 
        }, { quoted: mek });

        // React with success
        await conn.sendMessage(from, { 
            react: { text: "✅", key: mek.key } 
        });

    } catch (e) {
        console.error("Error in SIM data command:", e.message);
        
        // React with error
        try {
            await conn.sendMessage(from, { 
                react: { text: "❌", key: mek.key } 
            });
        } catch (reactError) {
            console.error("React error:", reactError.message);
        }

        // Send error message
        await conn.sendMessage(from, { 
            text: `❌ An error occurred while fetching SIM data.\n\nError: ${e.message}` 
        }, { quoted: mek });
    }
});
