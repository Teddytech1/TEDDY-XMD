/**
 * ╔══════════════════════════════════════════╗
 * ║   TOOLS & MAKER PLUGIN — 100 Commands   ║
 * ║   Image Edit + Scraping + Text Tools    ║
 * ║   NO API KEYS — Scraping only!          ║
 * ╚══════════════════════════════════════════╝
 *
 * Install dependencies:
 *   npm install jimp axios cheerio qrcode
 */

const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Safe requires ────────────────────────────────────────────────────────────
let Jimp, axios, cheerio, QRCode;
try { Jimp = require('jimp'); } catch {}
try { axios = require('axios'); } catch {}
try { cheerio = require('cheerio'); } catch {}
try { QRCode = require('qrcode'); } catch {}

const TMP = os.tmpdir();
function tmpFile(ext) { return path.join(TMP, `tool_${Date.now()}_${Math.random().toString(36).substr(2,5)}.${ext}`); }

// Download image from quoted/sent message
async function getImageBuffer(mek, conn) {
    try {
        const msg = mek.message;
        const imgMsg = msg?.imageMessage
            || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (!imgMsg) return null;
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    } catch { return null; }
}

// Send processed image file
async function sendImg(conn, from, mek, filepath, caption = '') {
    await conn.sendMessage(from, { image: fs.readFileSync(filepath), caption }, { quoted: mek });
    try { fs.unlinkSync(filepath); } catch {}
}

// HTTP scrape helper
async function scrape(url, hdrs = {}) {
    if (!axios) throw new Error('Run: npm install axios');
    const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ...hdrs },
        timeout: 12000
    });
    return res.data;
}

// ══════════════════════════════════════════════════════════════════════════════
//  🖼️  IMAGE FILTERS & EFFECTS  [1–25]
// ══════════════════════════════════════════════════════════════════════════════

// 1 – Blur
cmd({ pattern: "blur", alias: ["blurimg"], use: ".blur [1-20]", desc: "Blur an image", category: "tools", react: "🌫️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const amt = Math.min(Math.max(parseInt(args[0]) || 5, 1), 20);
        const img = await Jimp.read(buf);
        img.blur(amt);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🌫️ Blurred (strength: ${amt})`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 2 – Grayscale (Black & White)
cmd({ pattern: "grayscale", alias: ["bw", "blackwhite", "greyscale"], use: ".grayscale", desc: "Convert image to black & white", category: "tools", react: "⚫", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.grayscale();
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '⚫ Black & White applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 3 – Invert Colors
cmd({ pattern: "invert", alias: ["negative", "invertcolors"], use: ".invert", desc: "Invert image colors (negative effect)", category: "tools", react: "🔄", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.invert();
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🔄 Colors inverted!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 4 – Flip Horizontal
cmd({ pattern: "flip", alias: ["mirror", "hflip", "flipimg"], use: ".flip", desc: "Flip image horizontally (mirror)", category: "tools", react: "↔️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.flip(true, false);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '↔️ Flipped horizontally!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 5 – Flip Vertical
cmd({ pattern: "flop", alias: ["upsidedown", "vflip", "flopimg"], use: ".flop", desc: "Flip image vertically (upside down)", category: "tools", react: "↕️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.flip(false, true);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '↕️ Flipped vertically!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 6 – Rotate
cmd({ pattern: "rotate", alias: ["rotateimg", "rot90"], use: ".rotate [degrees]", desc: "Rotate image (default 90°)", category: "tools", react: "🔃", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const deg = parseInt(args[0]) || 90;
        const img = await Jimp.read(buf);
        img.rotate(deg);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🔃 Rotated ${deg}°`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 7 – Resize
cmd({ pattern: "resize", alias: ["resizeimg", "imgscale"], use: ".resize [width] [height]", desc: "Resize image to specified dimensions", category: "tools", react: "📐", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const w = parseInt(args[0]) || 512;
        const h = parseInt(args[1]) || Jimp.AUTO;
        const img = await Jimp.read(buf);
        img.resize(w, h);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `📐 Resized to ${w}×${h === Jimp.AUTO ? 'auto' : h}px`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 8 – Pixelate
cmd({ pattern: "pixel", alias: ["pixelate", "mosaic", "pixelimg"], use: ".pixel [size]", desc: "Pixelate/mosaic effect", category: "tools", react: "🔲", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const size = Math.min(Math.max(parseInt(args[0]) || 10, 2), 50);
        const img = await Jimp.read(buf);
        img.pixelate(size);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🔲 Pixelated (block size: ${size})`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 9 – Brightness
cmd({ pattern: "brightness", alias: ["bright", "imgbright"], use: ".brightness [-1 to 1]", desc: "Adjust image brightness", category: "tools", react: "☀️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const val = Math.min(Math.max(parseFloat(args[0]) || 0.3, -1), 1);
        const img = await Jimp.read(buf);
        img.brightness(val);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `☀️ Brightness: ${val > 0 ? '+' : ''}${val}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 10 – Contrast
cmd({ pattern: "contrast", alias: ["imgcontrast"], use: ".contrast [-1 to 1]", desc: "Adjust image contrast", category: "tools", react: "🎨", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const val = Math.min(Math.max(parseFloat(args[0]) || 0.3, -1), 1);
        const img = await Jimp.read(buf);
        img.contrast(val);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🎨 Contrast: ${val > 0 ? '+' : ''}${val}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 11 – Sepia Filter
cmd({ pattern: "sepia", alias: ["vintage", "retro", "oldphoto"], use: ".sepia", desc: "Apply sepia vintage filter", category: "tools", react: "🟤", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.sepia();
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🟤 Sepia/Vintage filter applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 12 – Crop to Square
cmd({ pattern: "square", alias: ["squareimg", "squarecrop"], use: ".square", desc: "Crop image into perfect square", category: "tools", react: "⬛", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        const size = Math.min(img.getWidth(), img.getHeight());
        img.crop(Math.floor((img.getWidth()-size)/2), Math.floor((img.getHeight()-size)/2), size, size);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `⬛ Cropped to ${size}×${size} square!`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 13 – Thumbnail
cmd({ pattern: "thumbnail", alias: ["thumb", "miniature"], use: ".thumbnail [size]", desc: "Create small thumbnail of image", category: "tools", react: "🔬", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const size = parseInt(args[0]) || 150;
        const img = await Jimp.read(buf);
        img.resize(size, Jimp.AUTO);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🔬 Thumbnail (${size}px wide)`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 14 – Posterize
cmd({ pattern: "posterize", alias: ["posterimg", "poster"], use: ".posterize [2-10]", desc: "Apply posterize effect", category: "tools", react: "🎨", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const val = Math.min(Math.max(parseInt(args[0]) || 5, 2), 10);
        const img = await Jimp.read(buf);
        img.posterize(val);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🎨 Posterized (${val} levels)`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 15 – Saturate
cmd({ pattern: "saturate", alias: ["vibrant", "vivid"], use: ".saturate [0-100]", desc: "Increase color saturation/vibrance", category: "tools", react: "🌈", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const amt = parseInt(args[0]) || 50;
        const img = await Jimp.read(buf);
        img.color([{ apply: 'saturate', params: [amt] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🌈 Saturated (+${amt})`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 16 – Desaturate (Muted Look)
cmd({ pattern: "desaturate", alias: ["muted", "desat"], use: ".desaturate [0-100]", desc: "Reduce saturation for muted look", category: "tools", react: "🌑", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const amt = parseInt(args[0]) || 50;
        const img = await Jimp.read(buf);
        img.color([{ apply: 'desaturate', params: [amt] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🌑 Desaturated (-${amt})`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 17 – Normalize Exposure
cmd({ pattern: "normalize", alias: ["fixphoto", "normimg"], use: ".normalize", desc: "Auto-normalize image exposure/levels", category: "tools", react: "⚖️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.normalize();
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '⚖️ Exposure normalized!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 18 – Neon Effect
cmd({ pattern: "neon", alias: ["neoneffect", "glowimg"], use: ".neon", desc: "Apply neon/glow effect to image", category: "tools", react: "💡", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.invert().color([{ apply: 'saturate', params: [100] }]).contrast(0.5);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '💡 Neon effect applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 19 – Red Filter
cmd({ pattern: "redfilter", alias: ["redtone", "redimg"], use: ".redfilter", desc: "Apply red tone filter to image", category: "tools", react: "🔴", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.color([{ apply: 'red', params: [80] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🔴 Red filter applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 20 – Blue Filter
cmd({ pattern: "bluefilter", alias: ["bluetone", "blueimg"], use: ".bluefilter", desc: "Apply blue tone filter", category: "tools", react: "🔵", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.color([{ apply: 'blue', params: [80] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🔵 Blue filter applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 21 – Green Filter
cmd({ pattern: "greenfilter", alias: ["greentone", "greenimg"], use: ".greenfilter", desc: "Apply green tone filter", category: "tools", react: "🟢", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.color([{ apply: 'green', params: [80] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🟢 Green filter applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 22 – Hue Shift
cmd({ pattern: "hue", alias: ["hueshift", "huerotate"], use: ".hue [0-360]", desc: "Shift image hue by degrees", category: "tools", react: "🌈", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const deg = parseInt(args[0]) || 90;
        const img = await Jimp.read(buf);
        img.color([{ apply: 'hue', params: [deg] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🌈 Hue shifted by ${deg}°`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 23 – Faded/Washed Effect
cmd({ pattern: "faded", alias: ["washed", "washedout", "fade"], use: ".faded", desc: "Faded/washed-out photo effect", category: "tools", react: "🌫️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.brightness(0.2).contrast(-0.3).color([{ apply: 'desaturate', params: [20] }]);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🌫️ Faded/washed effect applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 24 – Image Info
cmd({ pattern: "imginfo", alias: ["imageinfo", "imgmeta", "imgdata"], use: ".imginfo", desc: "Get image metadata (dimensions, size)", category: "tools", react: "ℹ️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        const kb = (buf.length / 1024).toFixed(1);
        reply(`ℹ️ *IMAGE INFO*\n\n📐 Width: ${img.getWidth()}px\n📏 Height: ${img.getHeight()}px\n📦 Size: ${kb} KB\n🎨 MIME: ${img.getMIME()}\n📊 Aspect: ${(img.getWidth()/img.getHeight()).toFixed(2)}:1\n🖼️ Megapixels: ${((img.getWidth()*img.getHeight())/1000000).toFixed(2)} MP`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 25 – Dither Effect
cmd({ pattern: "dither", alias: ["ditherimg", "retropixel"], use: ".dither", desc: "Apply retro dither pixel effect", category: "tools", react: "👾", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        img.dither565();
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '👾 Dither/retro effect applied!');
    } catch(e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🖼️  IMAGE MAKER TOOLS  [26–40]
// ══════════════════════════════════════════════════════════════════════════════

// 26 – QR Code Generator
cmd({ pattern: "qrcode", alias: ["qr", "makeqr", "qrgen"], use: ".qrcode <text or url>", desc: "Generate a QR code from text/URL", category: "tools", react: "📱", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!QRCode) return reply("❌ Run: npm install qrcode");
        const text = args.join(' ');
        if (!text) return reply("❌ Usage: .qrcode https://example.com");
        const out = tmpFile('png');
        await QRCode.toFile(out, text, { width: 400, margin: 2 });
        await conn.sendMessage(from, { image: fs.readFileSync(out), caption: `📱 *QR CODE*\n\n📝 ${text.substring(0,80)}` }, { quoted: mek });
        fs.unlinkSync(out);
    } catch(e) { reply('❌ ' + e.message); }
});

// 27 – White Background
cmd({ pattern: "whitebg", alias: ["bgwhite", "addwhitebg"], use: ".whitebg", desc: "Replace transparent background with white", category: "tools", react: "⬜", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const overlay = await Jimp.read(buf);
        const bg = new Jimp(overlay.getWidth(), overlay.getHeight(), 0xFFFFFFFF);
        bg.composite(overlay, 0, 0);
        const out = tmpFile('jpg'); await bg.writeAsync(out);
        await sendImg(conn, from, mek, out, '⬜ White background added!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 28 – Black Background
cmd({ pattern: "blackbg", alias: ["bgblack", "addblackbg"], use: ".blackbg", desc: "Replace background with black", category: "tools", react: "⬛", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const overlay = await Jimp.read(buf);
        const bg = new Jimp(overlay.getWidth(), overlay.getHeight(), 0x000000FF);
        bg.composite(overlay, 0, 0);
        const out = tmpFile('jpg'); await bg.writeAsync(out);
        await sendImg(conn, from, mek, out, '⬛ Black background added!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 29 – Gradient Image Generator
cmd({ pattern: "gradient", alias: ["makegradient", "gradientbg"], use: ".gradient", desc: "Generate a random gradient background image", category: "tools", react: "🌈", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const palettes = [[0xFF6B6B, 0x4ECDC4],[0x667eea, 0x764ba2],[0xf093fb, 0xf5576c],[0x4facfe, 0x00f2fe],[0x43e97b, 0x38f9d7],[0xfa709a, 0xfee140]];
        const [c1, c2] = palettes[Math.floor(Math.random() * palettes.length)];
        const img = new Jimp(512, 512);
        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const r = ((c1 >> 16) & 0xFF) + (( (c2 >> 16) & 0xFF) - ((c1 >> 16) & 0xFF)) * y / 512;
                const g = ((c1 >> 8) & 0xFF) + (((c2 >> 8) & 0xFF) - ((c1 >> 8) & 0xFF)) * y / 512;
                const b = (c1 & 0xFF) + ((c2 & 0xFF) - (c1 & 0xFF)) * y / 512;
                img.setPixelColor(Jimp.rgbaToInt(Math.round(r), Math.round(g), Math.round(b), 255), x, y);
            }
        }
        const out = tmpFile('png'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '🌈 Random gradient generated!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 30 – Solid Color Block
cmd({ pattern: "solidcolor", alias: ["colorblock", "makecolor"], use: ".solidcolor #FF5733", desc: "Generate solid color image block", category: "tools", react: "🎨", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const hex = (args[0] || '#4ECDC4').replace('#','');
        const r = parseInt(hex.substring(0,2),16)||78;
        const g = parseInt(hex.substring(2,4),16)||205;
        const b = parseInt(hex.substring(4,6),16)||196;
        const img = new Jimp(400, 400, Jimp.rgbaToInt(r,g,b,255));
        const out = tmpFile('png'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `🎨 #${hex.toUpperCase()} — RGB(${r},${g},${b})`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 31 – Watermark Text
cmd({ pattern: "watermark", alias: ["addwatermark", "wmark"], use: ".watermark <text>", desc: "Add text watermark to image", category: "tools", react: "💧", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const text = args.join(' ') || '© Watermark';
        const img = await Jimp.read(buf);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        img.print(font, 10, img.getHeight()-30, text);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, `💧 Watermark: "${text}"`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 32 – Stamp APPROVED
cmd({ pattern: "approved", alias: ["stampapproved", "greencheck"], use: ".approved", desc: "Stamp APPROVED on image", category: "tools", react: "✅", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        img.print(font, Math.floor(img.getWidth()/2)-80, Math.floor(img.getHeight()/2)-20, 'APPROVED ✅');
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '✅ APPROVED!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 33 – Stamp REJECTED
cmd({ pattern: "rejected", alias: ["stamprejected", "redx"], use: ".rejected", desc: "Stamp REJECTED on image", category: "tools", react: "❌", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image first!");
        const img = await Jimp.read(buf);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        img.print(font, Math.floor(img.getWidth()/2)-80, Math.floor(img.getHeight()/2)-20, 'REJECTED ❌');
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '❌ REJECTED!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 34 – Image Caption (Top + Bottom)
cmd({ pattern: "imgcaption", alias: ["addcaption", "memecaption"], use: ".imgcaption top text | bottom text", desc: "Add meme-style captions to image", category: "tools", react: "💬", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf = await getImageBuffer(mek, conn);
        if (!buf) return reply("❌ Send/quote an image!");
        const parts = args.join(' ').split('|');
        const top = parts[0]?.trim() || '';
        const bottom = parts[1]?.trim() || '';
        if (!top && !bottom) return reply("❌ Usage: .imgcaption top | bottom");
        const img = await Jimp.read(buf);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        if (top) img.print(font, 10, 10, top, img.getWidth()-20);
        if (bottom) img.print(font, 10, img.getHeight()-50, bottom, img.getWidth()-20);
        const out = tmpFile('jpg'); await img.writeAsync(out);
        await sendImg(conn, from, mek, out, '💬 Caption added!');
    } catch(e) { reply('❌ ' + e.message); }
});

// 35 – Stitch/Stack 2 Images
cmd({ pattern: "stitch", alias: ["stackimgs", "combineimgs", "mergeimgs"], use: ".stitch (send+quote two images)", desc: "Stitch two images side by side vertically", category: "tools", react: "📐", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!Jimp) return reply("❌ Run: npm install jimp");
        const buf1 = await getImageBuffer(mek, conn);
        const quotedImg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (!buf1 || !quotedImg) return reply("❌ Send image and QUOTE another image!");
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(quotedImg, 'image');
        const chunks = []; for await (const c of stream) chunks.push(c);
        const buf2 = Buffer.concat(chunks);
        const img1 = await Jimp.read(buf1);
        const img2 = await Jimp.read(buf2);
        const w = Math.max(img1.getWidth(), img2.getWidth());
        img1.resize(w, Jimp.AUTO); img2.resize(w, Jimp.AUTO);
        const combined = new Jimp(w, img1.getHeight()+img2.getHeight(), 0xFFFFFFFF);
        combined.composite(img1, 0, 0).composite(img2, 0, img1.getHeight());
        const out = tmpFile('jpg'); await combined.writeAsync(out);
        await sendImg(conn, from, mek, out, '📐 Images stitched together!');
    } catch(e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🔤  TEXT TOOLS  [36–60]
// ══════════════════════════════════════════════════════════════════════════════

// 36 – Fancy Unicode Text
cmd({ pattern: "fancy", alias: ["fancytext", "styletext"], use: ".fancy Your text", desc: "Convert to fancy Unicode styles", category: "tools", react: "✨", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .fancy text");
    const bold = t.split('').map(c => { const a=c.charCodeAt(0); return a>=65&&a<=90?String.fromCodePoint(0x1D400+a-65):a>=97&&a<=122?String.fromCodePoint(0x1D41A+a-97):c; }).join('');
    const double = t.split('').map(c => { const a=c.charCodeAt(0); return a>=65&&a<=90?String.fromCodePoint(0x1D538+a-65):a>=97&&a<=122?String.fromCodePoint(0x1D552+a-97):c; }).join('');
    reply(`✨ *FANCY TEXT*\n\n𝗕𝗼𝗹𝗱: *${t}*\n𝘐𝘵𝘢𝘭𝘪𝘤: _${t}_\n𝔻𝕠𝕦𝕓𝕝𝕖: ${double}\n𝕸𝖆𝖙𝖍: ${bold}`);
});

// 37 – Reverse Text
cmd({ pattern: "reverse", alias: ["reversetext", "backwards"], use: ".reverse text", desc: "Reverse text backwards", category: "tools", react: "🔄", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .reverse text");
    reply(`🔄 *REVERSED*\n\n${t.split('').reverse().join('')}`);
});

// 38 – Mock (Spongebob) Text
cmd({ pattern: "mock", alias: ["spongebob", "mocktext"], use: ".mock text", desc: "mOcKiNg SpOnGeBoB text style", category: "tools", react: "🧽", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .mock text");
    reply(`🧽 ${t.split('').map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join('')}`);
});

// 39 – Clap Text
cmd({ pattern: "clap", alias: ["claptext", "clapify"], use: ".clap text here", desc: "Add 👏 between each word", category: "tools", react: "👏", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .clap text here");
    reply(`👏 ${t.split(' ').join(' 👏 ')} 👏`);
});

// 40 – UPPERCASE
cmd({ pattern: "upper", alias: ["uppercase", "allcaps", "caps"], use: ".upper text", desc: "Convert to UPPERCASE", category: "tools", react: "🔠", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .upper text");
    reply(`🔠 ${t.toUpperCase()}`);
});

// 41 – lowercase
cmd({ pattern: "lower", alias: ["lowercase", "smallcase"], use: ".lower TEXT", desc: "Convert to lowercase", category: "tools", react: "🔡", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .lower TEXT");
    reply(`🔡 ${t.toLowerCase()}`);
});

// 42 – Title Case
cmd({ pattern: "titlecase", alias: ["titletext", "propercase"], use: ".titlecase text", desc: "Convert to Title Case", category: "tools", react: "📝", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .titlecase text");
    reply(`📝 ${t.replace(/\w\S*/g,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())}`);
});

// 43 – Morse Code Encoder
cmd({ pattern: "morse", alias: ["morseencode", "tomorse"], use: ".morse Hello", desc: "Text to Morse code", category: "tools", react: "📡", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ').toUpperCase();
    if (!t) return reply("❌ Usage: .morse Hello World");
    const MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'};
    reply(`📡 *MORSE*\n\n📝 ${t}\n📡 ${t.split('').map(c=>MAP[c]||c).join(' ')}`);
});

// 44 – Morse Decoder
cmd({ pattern: "demorse", alias: ["morsedecode", "unmorse"], use: ".demorse .- -... .--..", desc: "Decode Morse code to text", category: "tools", react: "📡", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .demorse .- -... -.-.");
    const REV = {'.-.':'R','--':'M','...':' S','-':' T','..':' I','-.':'N','---':'O','....-':'4','...--':'3','..---':'2','.----':'1','-----':'0','.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','.---':'J','-.-':'K','.-..':'L','.---.':'Q','...':'S','-..-':'X','-.--':'Y','--..':'Z','--.-':'Q','--..':"Z",'.---':'J','---.':'9','----':'UNKNOWN','.--.':'P','.---':'J','/':' '};
    const decoded = t.split(' / ').map(w => w.split(' ').map(c => {
        const map2 = {'.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9'};
        return map2[c] || '?';
    }).join('')).join(' ');
    reply(`📡 *DECODED*\n\n${decoded}`);
});

// 45 – Count Words
cmd({ pattern: "wordcount", alias: ["wcount", "countwords"], use: ".wordcount text", desc: "Count words and characters in text", category: "tools", react: "🔢", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .wordcount your text here");
    const words = t.split(/\s+/).filter(w=>w).length;
    const chars = t.length;
    const charsNoSpace = t.replace(/\s/g,'').length;
    const sentences = t.split(/[.!?]+/).filter(s=>s.trim()).length;
    reply(`🔢 *WORD COUNT*\n\n📝 Words: ${words}\n🔤 Characters: ${chars}\n🔤 No spaces: ${charsNoSpace}\n📖 Sentences: ${sentences}`);
});

// 46 – Caesar Cipher
cmd({ pattern: "caesar", alias: ["caesarcipher", "encode"], use: ".caesar [shift] text", desc: "Encode text with Caesar cipher", category: "tools", react: "🔐", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const shift = parseInt(args[0]) || 3;
    const t = args.slice(1).join(' ');
    if (!t) return reply("❌ Usage: .caesar 3 Hello World");
    const enc = t.split('').map(c => {
        if (c.match(/[a-z]/)) return String.fromCharCode((c.charCodeAt(0)-97+shift)%26+97);
        if (c.match(/[A-Z]/)) return String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65);
        return c;
    }).join('');
    reply(`🔐 *CAESAR CIPHER*\n\nShift: ${shift}\n📝 Original: ${t}\n🔐 Encoded: ${enc}`);
});

// 47 – Base64 Encode
cmd({ pattern: "base64encode", alias: ["b64enc", "encodeb64"], use: ".base64encode text", desc: "Encode text to Base64", category: "tools", react: "🔒", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .base64encode text");
    reply(`🔒 *BASE64 ENCODED*\n\n${Buffer.from(t).toString('base64')}`);
});

// 48 – Base64 Decode
cmd({ pattern: "base64decode", alias: ["b64dec", "decodeb64"], use: ".base64decode <base64>", desc: "Decode Base64 to text", category: "tools", react: "🔓", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .base64decode dGV4dA==");
    try { reply(`🔓 *DECODED*\n\n${Buffer.from(t,'base64').toString('utf-8')}`); }
    catch { reply('❌ Invalid Base64!'); }
});

// 49 – Emoji Text
cmd({ pattern: "emojitext", alias: ["emoji2", "addemoji"], use: ".emojitext text", desc: "Add random emojis between words", category: "tools", react: "😊", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .emojitext Hello World");
    const emojis = ['✨','🔥','💥','⚡','🌟','💫','🎯','🚀','💎','🌈'];
    const out = t.split(' ').map(w=>w+' '+emojis[Math.floor(Math.random()*emojis.length)]).join(' ');
    reply(out);
});

// 50 – Zalgo Text (Creepy)
cmd({ pattern: "zalgo", alias: ["creepy", "glitch", "zalgotext"], use: ".zalgo text", desc: "Make creepy glitched Zalgo text", category: "tools", react: "👻", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .zalgo text");
    const up = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈','͊','͋','͌'];
    const mid = ['̕','̛','̀','́','͘','̡','̢','̧','̨','̴','̵','̶','͜','͝','͞','͟','͠','͢','̸','̨'];
    const out = t.split('').map(c => c + up.slice(0,Math.floor(Math.random()*3)).join('') + mid.slice(0,Math.floor(Math.random()*3)).join('')).join('');
    reply(`👻 ${out}`);
});

// 51 – Repeat Text
cmd({ pattern: "repeat", alias: ["repeattext", "echo"], use: ".repeat [times] text", desc: "Repeat text N times", category: "tools", react: "🔁", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const times = Math.min(parseInt(args[0])||3, 20);
    const t = args.slice(1).join(' ');
    if (!t) return reply("❌ Usage: .repeat 3 text");
    reply(Array(times).fill(t).join('\n'));
});

// 52 – Strikethrough Text
cmd({ pattern: "strike", alias: ["strikethrough", "striketext"], use: ".strike text", desc: "̶S̶t̶r̶i̶k̶e̶t̶h̶r̶o̶u̶g̶h̶ text", category: "tools", react: "🚫", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ');
    if (!t) return reply("❌ Usage: .strike text");
    reply(t.split('').join('\u0336') + '\u0336');
});

// 53 – ASCII Art Text
cmd({ pattern: "ascii", alias: ["asciiart", "bigtext"], use: ".ascii text", desc: "Convert text to ASCII block letters", category: "tools", react: "🔠", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ').toUpperCase().substring(0,20);
    if (!t) return reply("❌ Usage: .ascii text");
    // Simple block letters using Unicode box chars
    const blocks = t.split('').map(c => `[${c}]`).join('');
    reply(`🔠 *ASCII*\n\n${blocks}\n\n_Use .fancy for more styles!_`);
});

// 54 – URL Shortener (scrape)
cmd({ pattern: "shorten", alias: ["urlshorten", "shorturl", "tinyurl"], use: ".shorten <url>", desc: "Shorten a URL using scraping", category: "tools", react: "🔗", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply("❌ Usage: .shorten https://example.com");
        const data = await scrape(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        reply(`🔗 *URL SHORTENED*\n\n📌 Original: ${url.substring(0,60)}\n✅ Short: ${data}`);
    } catch(e) { reply('❌ Error: ' + e.message); }
});

// 55 – Password Generator
cmd({ pattern: "password", alias: ["genpass", "makepassword", "randpass"], use: ".password [length]", desc: "Generate a strong random password", category: "tools", react: "🔐", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const len = Math.min(Math.max(parseInt(args[0])||16, 6), 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
    const pass = Array.from({length:len}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    const strength = len >= 16 ? '🟢 Strong' : len >= 10 ? '🟡 Medium' : '🔴 Weak';
    reply(`🔐 *PASSWORD*\n\n\`${pass}\`\n\n📏 Length: ${len}\n💪 Strength: ${strength}`);
});

// ══════════════════════════════════════════════════════════════════════════════
//  🌐  SCRAPING TOOLS  [56–85]
// ══════════════════════════════════════════════════════════════════════════════

// 56 – Wikipedia Summary
cmd({ pattern: "wiki", alias: ["wikipedia", "wikiinfo"], use: ".wiki topic", desc: "Scrape Wikipedia summary", category: "tools", react: "📚", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const q = args.join(' ');
        if (!q) return reply("❌ Usage: .wiki Pakistan");
        const data = await scrape(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (!data.extract) return reply(`❌ Not found on Wikipedia`);
        const text = data.extract.split('. ').slice(0,4).join('. ') + '.';
        reply(`📚 *${data.title}*\n\n${text}\n\n🔗 ${data.content_urls?.desktop?.page||''}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 57 – Dictionary Definition
cmd({ pattern: "define", alias: ["dict", "meaning", "definition"], use: ".define word", desc: "Scrape word definition from dictionary", category: "tools", react: "📖", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const w = args[0];
        if (!w) return reply("❌ Usage: .define word");
        const data = await scrape(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
        if (!Array.isArray(data)||!data[0]) return reply(`❌ "${w}" not found!`);
        const e = data[0];
        const meanings = e.meanings.slice(0,3).map(m=>`*${m.partOfSpeech}:*\n• ${m.definitions[0].definition}`).join('\n\n');
        reply(`📖 *${e.word}* ${e.phonetic||''}\n\n${meanings}`);
        const audio = e.phonetics?.find(p=>p.audio)?.audio;
        if (audio) {
            try { await conn.sendMessage(from, { audio: { url: audio.startsWith('http')?audio:'https:'+audio }, mimetype:'audio/mpeg' }, { quoted: mek }); } catch {}
        }
    } catch(e) { reply('❌ ' + e.message); }
});

// 58 – Country Info
cmd({ pattern: "country", alias: ["countryinfo", "nation"], use: ".country Pakistan", desc: "Scrape country information", category: "tools", react: "🌍", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const n = args.join(' ');
        if (!n) return reply("❌ Usage: .country Pakistan");
        const data = await scrape(`https://restcountries.com/v3.1/name/${encodeURIComponent(n)}`);
        if (!Array.isArray(data)||!data[0]) return reply(`❌ "${n}" not found!`);
        const c = data[0];
        reply(`🌍 *${c.name?.common}*\n\n🏛️ Official: ${c.name?.official}\n🏙️ Capital: ${c.capital?.[0]||'N/A'}\n🌎 Region: ${c.region}/${c.subregion}\n👥 Population: ${c.population?.toLocaleString()}\n📐 Area: ${c.area?.toLocaleString()} km²\n💰 Currency: ${Object.values(c.currencies||{})[0]?.name||'N/A'}\n🗣️ Languages: ${Object.values(c.languages||{}).join(', ')}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 59 – Weather (wttr.in scrape)
cmd({ pattern: "weather", alias: ["checkweather", "getweather"], use: ".weather Karachi", desc: "Scrape current weather info", category: "tools", react: "🌤️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const city = args.join('+') || 'Karachi';
        const data = await scrape(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const cur = data.current_condition[0];
        const area = data.nearest_area[0];
        reply(`🌤️ *${area.areaName[0].value}, ${area.country[0].value}*\n\n🌡️ Temp: ${cur.temp_C}°C / ${cur.temp_F}°F\n🌡️ Feels: ${cur.FeelsLikeC}°C\n💧 Humidity: ${cur.humidity}%\n🌬️ Wind: ${cur.windspeedKmph} km/h ${cur.winddir16Point}\n☁️ ${cur.weatherDesc[0].value}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 60 – Random Joke
cmd({ pattern: "joke", alias: ["randomjoke", "getjoke"], use: ".joke", desc: "Scrape a random joke", category: "tools", react: "😂", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://v2.jokeapi.dev/joke/Any?safe-mode');
        reply(`😂 *JOKE*\n\n${data.type==='single'?data.joke:data.setup+'\n\n_'+data.delivery+'_ 🥁'}`);
    } catch(e) { reply('😂 Why do programmers prefer dark mode?\n\n_Light attracts bugs!_ 🐛'); }
});

// 61 – Random Quote
cmd({ pattern: "quote", alias: ["randomquote", "inspire"], use: ".quote", desc: "Scrape a random inspirational quote", category: "tools", react: "💭", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://api.quotable.io/random');
        reply(`💭 *"${data.content}"*\n\n— _${data.author}_`);
    } catch(e) { reply('💭 "Success is not final; failure is not fatal." — Churchill'); }
});

// 62 – Random Fact
cmd({ pattern: "fact", alias: ["randomfact", "funfact"], use: ".fact", desc: "Scrape a random interesting fact", category: "tools", react: "🤓", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://uselessfacts.jsph.pl/api/v2/facts/random');
        reply(`🤓 *FACT*\n\n${data.text}`);
    } catch(e) { reply('🤓 Honey never spoils — 3000-year-old honey from Egyptian tombs is edible!'); }
});

// 63 – IP Info
cmd({ pattern: "ipinfo", alias: ["checkip", "ipdata"], use: ".ipinfo [ip]", desc: "Scrape IP address location info", category: "tools", react: "🌐", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const ip = args[0]||'';
        const data = await scrape(`http://ip-api.com/json/${ip}`);
        if (data.status!=='success') return reply("❌ IP not found!");
        reply(`🌐 *IP: ${data.query}*\n\n🌍 Country: ${data.country} (${data.countryCode})\n🏙️ City: ${data.city}\n📍 Region: ${data.regionName}\n📮 Zip: ${data.zip}\n🌐 ISP: ${data.isp}\n⏰ Timezone: ${data.timezone}\n📡 ${data.lat}, ${data.lon}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 64 – Crypto Price
cmd({ pattern: "crypto", alias: ["cryptoprice", "coinprice", "bitcoin"], use: ".crypto bitcoin", desc: "Scrape cryptocurrency price", category: "tools", react: "₿", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const coin = args[0]||'bitcoin';
        const data = await scrape(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd,pkr,eur&include_24hr_change=true`);
        const cd = data[coin.toLowerCase()];
        if (!cd) return reply(`❌ "${coin}" not found! Try: bitcoin, ethereum, dogecoin`);
        const chg = cd.usd_24h_change?.toFixed(2);
        reply(`${chg>0?'📈':'📉'} *${coin.toUpperCase()}*\n\n💵 USD: $${cd.usd?.toLocaleString()}\n📊 24h: ${chg>0?'+':''}${chg}%\n💶 EUR: €${cd.eur?.toLocaleString()}\n🇵🇰 PKR: ₨${cd.pkr?.toLocaleString()}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 65 – Currency Converter
cmd({ pattern: "currency", alias: ["convert", "exchange", "forex"], use: ".currency 100 USD PKR", desc: "Convert currency amounts", category: "tools", react: "💱", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const amt = parseFloat(args[0])||1;
        const from_c = (args[1]||'USD').toUpperCase();
        const to_c = (args[2]||'PKR').toUpperCase();
        const data = await scrape(`https://open.er-api.com/v6/latest/${from_c}`);
        if (data.result!=='success') return reply("❌ Rate not found!");
        const rate = data.rates[to_c];
        if (!rate) return reply(`❌ "${to_c}" currency not found!`);
        reply(`💱 *${amt} ${from_c} = *${(amt*rate).toFixed(2)} ${to_c}**\n\n📊 Rate: 1 ${from_c} = ${rate.toFixed(4)} ${to_c}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 66 – GitHub Profile
cmd({ pattern: "github", alias: ["gitprofile", "github2"], use: ".github username", desc: "Scrape GitHub profile stats", category: "tools", react: "🐙", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const user = args[0];
        if (!user) return reply("❌ Usage: .github username");
        const data = await scrape(`https://api.github.com/users/${user}`, {'Accept':'application/vnd.github.v3+json'});
        if (data.message) return reply(`❌ "${user}" not found!`);
        reply(`🐙 *@${data.login}*\n\n👤 ${data.name||'N/A'}\n📝 ${data.bio||'N/A'}\n📍 ${data.location||'N/A'}\n\n📦 Repos: ${data.public_repos}\n👥 Followers: ${data.followers}\n➡️ Following: ${data.following}\n🔗 ${data.html_url}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 67 – NPM Package Info
cmd({ pattern: "npm", alias: ["npminfo", "npmpackage"], use: ".npm package-name", desc: "Scrape npm package information", category: "tools", react: "📦", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const pkg = args[0];
        if (!pkg) return reply("❌ Usage: .npm express");
        const data = await scrape(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`);
        reply(`📦 *${data.name}@${data.version}*\n\n📝 ${data.description||'N/A'}\n👤 Author: ${data.author?.name||'N/A'}\n📜 License: ${data.license||'N/A'}\n\n📦 Install:\nnpm install ${data.name}`);
    } catch(e) { reply('❌ Not found: ' + e.message); }
});

// 68 – Anime Info
cmd({ pattern: "anime", alias: ["animeinfo", "animesearch"], use: ".anime Naruto", desc: "Scrape anime information", category: "tools", react: "🎌", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const q = args.join(' ');
        if (!q) return reply("❌ Usage: .anime Naruto");
        const data = await scrape(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
        const a = data.data?.[0];
        if (!a) return reply(`❌ "${q}" not found!`);
        reply(`🎌 *${a.title}*\n\n${a.synopsis?.substring(0,200)}...\n\n⭐ Score: ${a.score}/10\n📺 Episodes: ${a.episodes||'?'}\n📊 Status: ${a.status}\n🎭 Genres: ${a.genres?.map(g=>g.name).join(', ')}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 69 – Random Advice
cmd({ pattern: "advice", alias: ["getadvice", "dailyadvice"], use: ".advice", desc: "Scrape a random piece of advice", category: "tools", react: "💡", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://api.adviceslip.com/advice');
        reply(`💡 *ADVICE*\n\n"${data.slip?.advice}"`);
    } catch(e) { reply('💡 Always be yourself — the right people will appreciate you!'); }
});

// 70 – Dog Fact
cmd({ pattern: "dogfact", alias: ["puppyfact", "doginfo2"], use: ".dogfact", desc: "Scrape a random dog fact", category: "tools", react: "🐕", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://dog-api.kinduff.com/api/facts');
        reply(`🐕 *DOG FACT*\n\n${data.facts[0]}`);
    } catch(e) { reply('🐕 Dogs can smell your emotions through changes in your sweat!'); }
});

// 71 – Cat Fact
cmd({ pattern: "catfact", alias: ["kittyfact", "catinfo2"], use: ".catfact", desc: "Scrape a random cat fact", category: "tools", react: "🐈", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://catfact.ninja/fact');
        reply(`🐈 *CAT FACT*\n\n${data.fact}`);
    } catch(e) { reply('🐈 Cats sleep 70% of their lives — up to 16 hours daily!'); }
});

// 72 – Activity Idea (for bored people)
cmd({ pattern: "activity", alias: ["bored", "whatodo", "boredidea"], use: ".activity", desc: "Get random activity suggestion", category: "tools", react: "🎯", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('https://www.boredapi.com/api/activity');
        reply(`🎯 *ACTIVITY IDEA*\n\n${data.activity}\n\n📂 Type: ${data.type}\n👥 Participants: ${data.participants}`);
    } catch(e) { reply('🎯 Try going for a 30-minute walk outside!'); }
});

// 73 – Number Facts
cmd({ pattern: "numfact", alias: ["numberfact", "numtrivia"], use: ".numfact [number]", desc: "Get interesting fact about a number", category: "tools", react: "🔢", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const num = args[0] || 'random';
        const data = await scrape(`http://numbersapi.com/${num}/trivia`);
        reply(`🔢 *NUMBER FACT*\n\n${data}`);
    } catch(e) { reply('🔢 The number 0 (zero) was invented by Indian mathematician Brahmagupta!'); }
});

// 74 – Pakistani City Info (scrape Wikipedia)
cmd({ pattern: "cityinfo", alias: ["city", "getcity"], use: ".cityinfo Lahore", desc: "Scrape info about a Pakistani city", category: "tools", react: "🏙️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const city = args.join(' ')||'Karachi';
        const data = await scrape(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
        if (!data.extract) return reply(`❌ "${city}" not found!`);
        reply(`🏙️ *${data.title}*\n\n${data.extract.substring(0,400)}...`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 75 – ISS Position (Live)
cmd({ pattern: "isspos", alias: ["iss", "spacestation", "isstrack"], use: ".isspos", desc: "Get current ISS space station location", category: "tools", react: "🛸", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const data = await scrape('http://api.open-notify.org/iss-now.json');
        const { latitude, longitude } = data.iss_position;
        reply(`🛸 *ISS LIVE POSITION*\n\n📍 Latitude: ${parseFloat(latitude).toFixed(4)}°\n📍 Longitude: ${parseFloat(longitude).toFixed(4)}°\n⏰ Updated: ${new Date(data.timestamp*1000).toUTCString()}\n\n🗺️ View: https://maps.google.com/?q=${latitude},${longitude}`);
    } catch(e) { reply('❌ ' + e.message); }
});

// 76 – Random Color Picker
cmd({ pattern: "randomcolor", alias: ["colorpick", "pickcolor", "rcolor"], use: ".randomcolor", desc: "Generate a random color with hex & RGB", category: "tools", react: "🎨", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    const r=Math.floor(Math.random()*256), g=Math.floor(Math.random()*256), b=Math.floor(Math.random()*256);
    const hex='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
    const hsl = (()=>{ const r1=r/255,g1=g/255,b1=b/255; const max=Math.max(r1,g1,b1), min=Math.min(r1,g1,b1); let h,s,l=(max+min)/2; if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r1:h=(g1-b1)/d+(g1<b1?6:0);break;case g1:h=(b1-r1)/d+2;break;case b1:h=(r1-g1)/d+4;break;}h/=6;} return `${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%`; })();
    reply(`🎨 *RANDOM COLOR*\n\n🎨 HEX: ${hex}\n🔴 RGB: rgb(${r}, ${g}, ${b})\n💡 HSL: hsl(${hsl})\n\n🟥 Red: ${r}\n🟩 Green: ${g}\n🟦 Blue: ${b}`);
});

// 77 – Minecraft Player Info
cmd({ pattern: "mcplayer", alias: ["minecraft", "mcuser"], use: ".mcplayer username", desc: "Scrape Minecraft player info", category: "tools", react: "⛏️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!axios) return reply("❌ Run: npm install axios");
        const user = args[0];
        if (!user) return reply("❌ Usage: .mcplayer username");
        const data = await scrape(`https://api.mojang.com/users/profiles/minecraft/${user}`);
        reply(`⛏️ *${data.name}*\n\n🆔 UUID: ${data.id}\n🎮 https://namemc.com/profile/${data.name}`);
    } catch(e) { reply('❌ Player not found!'); }
});

// 78 – Timezone World Clock
cmd({ pattern: "worldclock", alias: ["timezone", "timeat", "clock2"], use: ".worldclock America/New_York", desc: "Get current time at any timezone", category: "tools", react: "🕐", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const tz = args.join('_') || 'Asia/Karachi';
    try {
        const time = new Date().toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
        reply(`🕐 *WORLD CLOCK*\n\n🌍 Timezone: ${tz}\n⏰ ${time}`);
    } catch(e) { reply(`❌ Invalid timezone: ${tz}\n\nExamples: Asia/Karachi, America/New_York, Europe/London`); }
});

// 79 – Date Calculator
cmd({ pattern: "datecalc", alias: ["daysbetween", "datediff", "dayscalc"], use: ".datecalc 2024-01-01 2025-01-01", desc: "Calculate days between two dates", category: "tools", react: "📅", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const d1 = new Date(args[0]||'2000-01-01');
    const d2 = new Date(args[1]||new Date().toISOString().split('T')[0]);
    if (isNaN(d1)||isNaN(d2)) return reply("❌ Usage: .datecalc YYYY-MM-DD YYYY-MM-DD");
    const diff = Math.abs(d2-d1);
    const days = Math.floor(diff/(1000*60*60*24));
    const weeks = Math.floor(days/7);
    const months = Math.floor(days/30);
    const years = Math.floor(days/365);
    reply(`📅 *DATE CALC*\n\n📌 ${args[0]||'2000-01-01'} → ${args[1]||'today'}\n\n⏳ ${days} days\n📆 ${weeks} weeks\n🗓️ ~${months} months\n📅 ~${years} years`);
});

// 80 – Age Calculator
cmd({ pattern: "age", alias: ["calcage", "myage", "agecalc"], use: ".age YYYY-MM-DD", desc: "Calculate exact age from birthdate", category: "tools", react: "🎂", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const bdate = new Date(args[0]);
    if (isNaN(bdate)) return reply("❌ Usage: .age 1995-06-15");
    const now = new Date();
    let years = now.getFullYear()-bdate.getFullYear();
    let months = now.getMonth()-bdate.getMonth();
    let days = now.getDate()-bdate.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now-bdate)/(1000*60*60*24));
    reply(`🎂 *AGE CALCULATOR*\n\n📅 Born: ${bdate.toDateString()}\n\n🎂 Age: ${years} years, ${months} months, ${days} days\n⏳ Total: ${totalDays.toLocaleString()} days`);
});

// 81 – Unit Converter
cmd({ pattern: "unitconv", alias: ["convert2", "units"], use: ".unitconv 100 km miles", desc: "Convert between common units", category: "tools", react: "📏", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const amt = parseFloat(args[0]);
    const from_u = args[1]?.toLowerCase();
    const to_u = args[2]?.toLowerCase();
    if (!amt||!from_u||!to_u) return reply("❌ Usage: .unitconv 100 km miles\n\nSupported: km↔miles, kg↔lbs, c↔f, m↔ft, l↔gal");
    const conversions = {
        'km-miles': v=>v*0.621371, 'miles-km': v=>v*1.60934,
        'kg-lbs': v=>v*2.20462, 'lbs-kg': v=>v*0.453592,
        'c-f': v=>v*9/5+32, 'f-c': v=>(v-32)*5/9,
        'm-ft': v=>v*3.28084, 'ft-m': v=>v*0.3048,
        'l-gal': v=>v*0.264172, 'gal-l': v=>v*3.78541,
        'cm-in': v=>v*0.393701, 'in-cm': v=>v*2.54
    };
    const key = `${from_u}-${to_u}`;
    const fn = conversions[key];
    if (!fn) return reply(`❌ Conversion not supported!\n\nTry: km↔miles, kg↔lbs, c↔f, m↔ft, l↔gal`);
    reply(`📏 *UNIT CONVERTER*\n\n${amt} ${from_u.toUpperCase()} = *${fn(amt).toFixed(4)} ${to_u.toUpperCase()}*`);
});

// 82 – BMI Calculator
cmd({ pattern: "bmi", alias: ["calcbmi", "bodymass"], use: ".bmi [weight kg] [height cm]", desc: "Calculate BMI and health status", category: "tools", react: "⚖️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const weight = parseFloat(args[0]);
    const height = parseFloat(args[1]);
    if (!weight||!height) return reply("❌ Usage: .bmi 70 175 (kg and cm)");
    const bmi = weight/((height/100)**2);
    let status, emoji;
    if (bmi<18.5){status='Underweight';emoji='🔵';}
    else if (bmi<25){status='Normal weight';emoji='🟢';}
    else if (bmi<30){status='Overweight';emoji='🟡';}
    else{status='Obese';emoji='🔴';}
    reply(`⚖️ *BMI CALCULATOR*\n\n⚖️ Weight: ${weight} kg\n📏 Height: ${height} cm\n\n📊 BMI: *${bmi.toFixed(1)}*\n${emoji} Status: *${status}*`);
});

// 83 – Palindrome Check
cmd({ pattern: "palindrome", alias: ["ispalindrome", "checkpalindrome"], use: ".palindrome racecar", desc: "Check if text is a palindrome", category: "tools", react: "🔄", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const t = args.join(' ').toLowerCase().replace(/[^a-z0-9]/g,'');
    if (!t) return reply("❌ Usage: .palindrome racecar");
    const rev = t.split('').reverse().join('');
    const is = t === rev;
    reply(`🔄 *PALINDROME CHECK*\n\n📝 Text: "${args.join(' ')}"\n\n${is ? '✅ YES — It IS a palindrome!' : '❌ NO — Not a palindrome.'}\n\nForward: ${t}\nReverse: ${rev}`);
});

// 84 – Fibonacci
cmd({ pattern: "fibonacci", alias: ["fib", "fibseq"], use: ".fibonacci [n]", desc: "Generate Fibonacci sequence", category: "tools", react: "🔢", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const n = Math.min(parseInt(args[0])||10, 30);
    const seq = [0, 1];
    for (let i = 2; i < n; i++) seq.push(seq[i-1]+seq[i-2]);
    reply(`🔢 *FIBONACCI (${n} numbers)*\n\n${seq.slice(0,n).join(', ')}`);
});

// 85 – Prime Number Check
cmd({ pattern: "isprime", alias: ["primecheck", "prime"], use: ".isprime 17", desc: "Check if a number is prime", category: "tools", react: "🔢", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const n = parseInt(args[0]);
    if (!n || n < 1) return reply("❌ Usage: .isprime 17");
    if (n < 2) return reply(`❌ ${n} is NOT prime`);
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(n); i++) { if (n%i===0){isPrime=false;break;} }
    reply(`🔢 *PRIME CHECK*\n\n${n} is ${isPrime?'✅ PRIME':'❌ NOT PRIME'}${!isPrime?`\n\nDivisible by: ${Array.from({length:Math.floor(Math.sqrt(n))-1},(_,i)=>i+2).filter(i=>n%i===0).join(', ')}`:''}`);
});

// ══════════════════════════════════════════════════════════════════════════════
//  🔧  UTILITY TOOLS  [86–100]
// ══════════════════════════════════════════════════════════════════════════════

// 86 – Random Number Generator
cmd({ pattern: "randomnum", alias: ["rng", "randnum", "picknum"], use: ".randomnum [min] [max]", desc: "Generate random number in range", category: "tools", react: "🎲", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const min=parseInt(args[0])||1, max=parseInt(args[1])||100;
    if (min>=max) return reply("❌ Min must be less than max!");
    const num=Math.floor(Math.random()*(max-min+1))+min;
    reply(`🎲 *RANDOM NUMBER*\n\nRange: ${min}–${max}\n🎯 Result: *${num}*`);
});

// 87 – Coin Flip
cmd({ pattern: "coinflip", alias: ["flip2", "toss", "headsortails"], use: ".coinflip", desc: "Flip a virtual coin", category: "tools", react: "🪙", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    const r = Math.random();
    const result = r < 0.5 ? '🟡 HEADS' : '⚪ TAILS';
    reply(`🪙 *COIN FLIP*\n\nFlipping...\n\n${result}!`);
});

// 88 – Dice Roll
cmd({ pattern: "dice", alias: ["rolldice", "roll2", "d6"], use: ".dice [sides]", desc: "Roll a virtual dice", category: "tools", react: "🎲", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const sides=parseInt(args[0])||6;
    if (sides<2||sides>100) return reply("❌ Sides must be 2–100");
    const roll=Math.floor(Math.random()*sides)+1;
    reply(`🎲 *DICE ROLL (d${sides})*\n\nRolling...\n\n🎯 Result: *${roll}*`);
});

// 89 – 8 Ball
cmd({ pattern: "8ball", alias: ["ask8ball", "magic8", "eightball"], use: ".8ball question?", desc: "Ask the magic 8-ball anything", category: "tools", react: "🎱", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const q = args.join(' ');
    if (!q) return reply("❌ Ask a question: .8ball Will I win?");
    const answers=['Yes, definitely! ✅','Without a doubt! ✅','Most likely! 🟢','Signs point to yes! 🟢','It is certain ✅','Cannot predict now 🟡','Ask again later 🟡','Reply hazy, try again 🟡','Don\'t count on it ❌','Very doubtful ❌','My sources say no ❌','Outlook not so good 🔴'];
    reply(`🎱 *MAGIC 8-BALL*\n\n❓ ${q}\n\n💬 "${answers[Math.floor(Math.random()*answers.length)]}"`);
});

// 90 – Ship (Compatibility)
cmd({ pattern: "ship", alias: ["shipmatch", "lovematch", "compat"], use: ".ship Name1 + Name2", desc: "Calculate ship compatibility %", category: "tools", react: "💘", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const text = args.join(' ');
    if (!text.includes('+')&&!text.includes('and')) return reply("❌ Usage: .ship Alice + Bob");
    const parts = text.split(/\s*\+\s*|\s+and\s+/i);
    const n1=parts[0]?.trim(), n2=parts[1]?.trim();
    if (!n1||!n2) return reply("❌ Usage: .ship Name1 + Name2");
    // Deterministic but looks random
    const seed = [...(n1+n2).toLowerCase()].reduce((a,c)=>a+c.charCodeAt(0),0);
    const pct = 40 + (seed % 60);
    const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
    const msg = pct>=80?'Perfect match! 💖':pct>=60?'Great potential! 💕':pct>=40?'Could work! 💛':'Keep trying! 😅';
    reply(`💘 *SHIP METER*\n\n❤️ ${n1} + ${n2}\n\n[${bar}] ${pct}%\n\n${msg}`);
});

// 91 – Would You Rather
cmd({ pattern: "wyr", alias: ["wouldyourather", "wyrquestion"], use: ".wyr", desc: "Random would-you-rather question", category: "tools", react: "🤔", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    const q = [
        ["Be able to fly","Be able to become invisible"],
        ["Have too much money","Have too much time"],
        ["Live without internet","Live without AC"],
        ["Always tell the truth","Always lie"],
        ["Lose all your money","Lose all your memories"],
        ["Be very tall","Be very fast"],
        ["Speak all languages","Play all instruments"]
    ];
    const [a,b] = q[Math.floor(Math.random()*q.length)];
    reply(`🤔 *WOULD YOU RATHER?*\n\n🅰️ ${a}\n\nOR\n\n🅱️ ${b}\n\n_Reply A or B!_`);
});

// 92 – This or That
cmd({ pattern: "thisorthat", alias: ["tot", "pickthat"], use: ".thisorthat", desc: "Random This or That choices", category: "tools", react: "⚖️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    const pairs=[["Tea ☕","Coffee ☕"],["Pizza 🍕","Burger 🍔"],["Mountains 🏔️","Beach 🏖️"],["Cat 🐱","Dog 🐶"],["Morning 🌅","Night 🌙"],["Netflix 📺","Gaming 🎮"],["Biryani 🍛","Pizza 🍕"],["WhatsApp 💬","Instagram 📸"]];
    const [a,b]=pairs[Math.floor(Math.random()*pairs.length)];
    reply(`⚖️ *THIS OR THAT?*\n\n${a}\n\nVS\n\n${b}\n\n_Reply A or B!_`);
});

// 93 – Timer (countdown reply)
cmd({ pattern: "timer", alias: ["countdown2", "settimer"], use: ".timer [seconds] [label]", desc: "Start a countdown timer", category: "tools", react: "⏱️", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const secs = Math.min(parseInt(args[0])||10, 60);
    const label = args.slice(1).join(' ') || 'Timer';
    reply(`⏱️ *${label}* — ${secs}s started!`);
    setTimeout(() => conn.sendMessage(from, { text: `⏰ *${label.toUpperCase()} DONE!*\n\n${secs} seconds finished!` }, { quoted: mek }), secs*1000);
});

// 94 – Text Encrypt (simple XOR)
cmd({ pattern: "encrypt", alias: ["textencrypt", "xorenc"], use: ".encrypt key text", desc: "Simple XOR encrypt text", category: "tools", react: "🔒", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const key = args[0];
    const text = args.slice(1).join(' ');
    if (!key||!text) return reply("❌ Usage: .encrypt mykey Hello World");
    const enc = Buffer.from(text.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join('')).toString('base64');
    reply(`🔒 *ENCRYPTED*\n\n🔑 Key: ${key}\n📝 Original: ${text}\n🔒 Encrypted: ${enc}\n\n_Use .decrypt ${key} <encrypted> to decode_`);
});

// 95 – Text Decrypt (simple XOR)
cmd({ pattern: "decrypt", alias: ["textdecrypt", "xordec"], use: ".decrypt key <encrypted>", desc: "Decrypt XOR encrypted text", category: "tools", react: "🔓", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const key = args[0];
    const enc = args[1];
    if (!key||!enc) return reply("❌ Usage: .decrypt mykey <base64encrypted>");
    try {
        const bytes = Buffer.from(enc,'base64').toString();
        const dec = bytes.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join('');
        reply(`🔓 *DECRYPTED*\n\n🔑 Key: ${key}\n✅ Decoded: ${dec}`);
    } catch { reply('❌ Invalid encrypted text!'); }
});

// 96 – Random Emoji
cmd({ pattern: "randomemoji", alias: ["emoji3", "randomemo"], use: ".randomemoji [count]", desc: "Generate random emojis", category: "tools", react: "😊", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const count = Math.min(parseInt(args[0])||5, 20);
    const emojis = ['😀','😂','🥰','😎','🤔','😱','🎉','🔥','💯','✨','🌈','🎯','🚀','💎','🏆','🎸','🌺','🦋','🐉','⚡','🌙','☀️','🎭','🎪','🎨','🎵','🎲','🎮','💫','🌟'];
    const picked = Array.from({length:count},()=>emojis[Math.floor(Math.random()*emojis.length)]).join(' ');
    reply(`😊 *RANDOM EMOJIS*\n\n${picked}`);
});

// 97 – Color Info from HEX
cmd({ pattern: "colorinfo", alias: ["hexcolor", "colorhex"], use: ".colorinfo #FF5733", desc: "Get color info from HEX code", category: "tools", react: "🎨", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const hex = (args[0]||'#FF5733').replace('#','');
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return reply("❌ Usage: .colorinfo #FF5733");
    const r=parseInt(hex.substring(0,2),16), g=parseInt(hex.substring(2,4),16), b=parseInt(hex.substring(4,6),16);
    const brightness = (r*299+g*587+b*114)/1000;
    const isDark = brightness < 128;
    reply(`🎨 *COLOR: #${hex.toUpperCase()}*\n\n🔴 Red: ${r}\n🟢 Green: ${g}\n🔵 Blue: ${b}\n\n☀️ Brightness: ${Math.round(brightness)}/255\n🌓 Type: ${isDark?'Dark 🌙':'Light ☀️'}\n\n💡 Text on this bg: ${isDark?'White ⬜':'Black ⬛'}`);
});

// 98 – Loan Calculator
cmd({ pattern: "loan", alias: ["calcloan", "loancalc", "emi"], use: ".loan [amount] [rate%] [months]", desc: "Calculate loan EMI and total payment", category: "tools", react: "🏦", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    const P = parseFloat(args[0])||100000;
    const r = parseFloat(args[1])/100/12 || 0.01;
    const n = parseInt(args[2])||12;
    if (r===0) return reply(`🏦 EMI: ${(P/n).toFixed(2)} (0% interest)`);
    const emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
    const total = emi*n;
    const interest = total-P;
    reply(`🏦 *LOAN CALCULATOR*\n\n💰 Principal: ${P.toLocaleString()}\n📊 Rate: ${(r*12*100).toFixed(1)}% p.a.\n📅 Months: ${n}\n\n✅ Monthly EMI: *${emi.toFixed(2)}*\n💸 Total Payment: ${total.toFixed(2)}\n📈 Total Interest: ${interest.toFixed(2)}`);
});

// 99 – Percentage Calculator
cmd({ pattern: "percent", alias: ["percentage", "calcpct"], use: ".percent [value] of [total]", desc: "Calculate percentage", category: "tools", react: "📊", filename: __filename },
async (conn, mek, m, { from, args, reply }) => {
    // Supports: .percent 25 of 200 OR .percent 50 200
    const text = args.join(' ');
    if (!text) return reply("❌ Usage: .percent 25 of 200\nOr: .percent 50 200");
    let val, total;
    if (text.includes(' of ')) { const parts=text.split(' of '); val=parseFloat(parts[0]); total=parseFloat(parts[1]); }
    else { val=parseFloat(args[0]); total=parseFloat(args[1]); }
    if (!val||!total) return reply("❌ Usage: .percent 25 of 200");
    const pct = (val/total*100).toFixed(2);
    reply(`📊 *PERCENTAGE*\n\n${val} out of ${total}\n\n= *${pct}%*\n\n📈 ${pct > 50 ? 'More than half' : pct > 25 ? 'About a quarter' : 'Less than a quarter'}`);
});

// 100 – Tools Menu
cmd({ pattern: "toolsmenu", alias: ["tools", "toolslist", "toolshelp"], use: ".toolsmenu", desc: "Show all tools & maker commands", category: "tools", react: "🛠️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    reply(`🛠️ *TOOLS & MAKER — 100 Commands*\n\n📦 *Install:* npm install jimp axios qrcode\n\n🖼️ *Image Filters (1-25):*\n• .blur .grayscale .invert .flip .flop\n• .rotate .resize .pixel .brightness .contrast\n• .sepia .square .thumbnail .posterize .saturate\n• .desaturate .normalize .neon .redfilter .bluefilter\n• .greenfilter .hue .faded .imginfo .dither\n\n🖼️ *Image Maker (26-35):*\n• .qrcode .whitebg .blackbg .gradient .solidcolor\n• .watermark .approved .rejected .imgcaption .stitch\n\n🔤 *Text Tools (36-55):*\n• .fancy .reverse .mock .clap .upper .lower\n• .titlecase .morse .demorse .wordcount .caesar\n• .base64encode .base64decode .emojitext .zalgo\n• .repeat .strike .ascii .shorten .password\n\n🌐 *Scraping (56-85):*\n• .wiki .define .country .weather .joke .quote\n• .fact .ipinfo .crypto .currency .github .npm\n• .anime .advice .dogfact .catfact .activity\n• .numfact .cityinfo .isspos .randomcolor .mcplayer\n• .worldclock .datecalc .age .unitconv .bmi\n• .palindrome .fibonacci .isprime\n\n🔧 *Utilities (86-100):*\n• .randomnum .coinflip .dice .8ball .ship\n• .wyr .thisorthat .timer .encrypt .decrypt\n• .randomemoji .colorinfo .loan .percent .toolsmenu`);
});
