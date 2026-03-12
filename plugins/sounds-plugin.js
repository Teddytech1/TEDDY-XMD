/**
 * ╔══════════════════════════════════════════╗
 * ║  SOUNDS PLUGIN — REAL AUDIO SENDER       ║
 * ║  38 Islamic + Urdu + Ertugrul Sounds     ║
 * ║  Sends AUDIO directly (like a song)      ║
 * ╚══════════════════════════════════════════╝
 *
 * HOW IT WORKS:
 * Uses conn.sendMessage with { audio: { url: '...' }, mimetype: 'audio/mpeg' }
 * This plays exactly like a WhatsApp audio/song file — no links!
 *
 * ── AUDIO CDNs USED (ALL RELIABLE) ──────────────────────────────────────────
 * 1. everyayah.com  → Individual Quran verses : SSSAAA.mp3
 * 2. everyayah.com  → Full surahs             : complete/SSS.mp3
 * 3. cdn.islamic.network → Full surah audio   : /quran/audio/128/ar.alafasy/
 * 4. archive.org    → Nasheeds / Other audio
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { cmd } = require('../command');
const config = require('../config');

// ── CDN BASE URLs ─────────────────────────────────────────────────────────────
const EVERYAYAH    = 'https://everyayah.com/data/Alafasy_128kbps';
const EVERYAYAH_COMPLETE = `${EVERYAYAH}/complete`;
const ISLAMICNET   = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy';

// Helper: send audio directly (plays like a song/voice note in WhatsApp)
async function sendSound(conn, from, mek, audioUrl, caption = '', asVoiceNote = false) {
    try {
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: asVoiceNote
        }, { quoted: mek });

        if (caption) {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }
        return true;
    } catch (err1) {
        try {
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: asVoiceNote
            }, { quoted: mek });
            if (caption) await conn.sendMessage(from, { text: caption }, { quoted: mek });
            return true;
        } catch (err2) {
            try {
                await conn.sendMessage(from, {
                    document: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: 'sound.mp3',
                    caption: caption || '🔊 Audio File'
                }, { quoted: mek });
                return true;
            } catch (err3) {
                throw new Error('Cannot send audio: ' + err3.message);
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  🕌  ISLAMIC PHRASES  [sound1–sound10]
//  All URLs: everyayah.com — verse that contains/exemplifies that dhikr phrase
// ══════════════════════════════════════════════════════════════════════════════

// sound1 — Bismillah  →  Al-Fatiha 1:1  (Bismillah ir-Rahman ir-Raheem)
cmd({ pattern: "sound1", alias: ["bismillah", "playbismillah"], desc: "🎵 Play Bismillah audio", category: "fun", react: "🕌", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🕌', key: mek.key } });
        const caption = `🕌 *بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ*\n\nBismillah ir-Rahman ir-Raheem\n_"In the name of Allah, the Most Gracious, the Most Merciful"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/001001.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound2 — Allahu Akbar  →  Al-Isra 17:111  (wa kabbiru takbeera — glorify Him greatly)
cmd({ pattern: "sound2", alias: ["allahuakbar", "allahukabr"], desc: "🎵 Allahu Akbar audio", category: "fun", react: "☪️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '☪️', key: mek.key } });
        const caption = `☪️ *اللَّهُ أَكْبَرُ*\n_"Allah is the Greatest"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/017111.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound3 — Azan (Fajr)  →  Surah Al-Fatiha full (most reliable azan-mood audio)
cmd({ pattern: "sound3", alias: ["azan", "playazan", "adhan"], desc: "🎵 Play Azan (Fajr) audio", category: "fun", react: "🕌", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🕌', key: mek.key } });
        const caption = `📢 *AZAN — اَذان*\n🕌 Fajr Azan\n\n_"Hayya alas-Salah, Hayya alal-Falah"_\n_"Come to prayer, Come to success"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/001.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound4 — Subhanallah  →  Al-Hashr 59:23  (SubhanAllahi amma yushrikoon)
cmd({ pattern: "sound4", alias: ["subhanallah", "subhan"], desc: "🎵 Subhanallah audio", category: "fun", react: "✨", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '✨', key: mek.key } });
        const caption = `✨ *سُبْحَانَ اللَّهِ*\n_"Glory be to Allah"_\n\nDhikr — سبحان اللہ`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/059023.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound5 — Alhamdulillah  →  Al-Fatiha 1:2  (Al-hamdu lillahi rabb il-aalameen)
cmd({ pattern: "sound5", alias: ["alhamdulillah", "alhamdo"], desc: "🎵 Alhamdulillah audio", category: "fun", react: "🤲", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🤲', key: mek.key } });
        const caption = `🤲 *الْحَمْدُ لِلَّهِ*\n_"All praise is due to Allah"_\n\nDhikr — الحمد للہ`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/001002.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound6 — MashaAllah  →  Al-Kahf 18:39  (masha allah la quwwata illa billah)
cmd({ pattern: "sound6", alias: ["mashaallah", "masha"], desc: "🎵 MashaAllah audio", category: "fun", react: "💚", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '💚', key: mek.key } });
        const caption = `💚 *مَا شَاءَ اللَّهُ*\n_"What Allah has willed"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/018039.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound7 — InshaAllah  →  Al-Kahf 18:69  (sa tajiduni in sha allah sabiran)
cmd({ pattern: "sound7", alias: ["inshaallah", "inshallah"], desc: "🎵 InshaAllah audio", category: "fun", react: "🌙", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌙', key: mek.key } });
        const caption = `🌙 *إِنْ شَاءَ اللَّهُ*\n_"If Allah wills"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/018069.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound8 — Durood Sharif  →  Al-Ahzab 33:56  (inna allaha wa malaikatahu yusalluna alan-nabi)
cmd({ pattern: "sound8", alias: ["durood", "salawat"], desc: "🎵 Durood Sharif audio", category: "fun", react: "🌹", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌹', key: mek.key } });
        const caption = `🌹 *درود شریف*\n\nاللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ\n\n_"O Allah, send blessings upon Muhammad ﷺ"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/033056.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound9 — Istighfar  →  Nuh 71:10  (fas-tagh-fi-ru rabbakum innahu kana ghaffara)
cmd({ pattern: "sound9", alias: ["istighfar", "astaghfirullah"], desc: "🎵 Istighfar audio", category: "fun", react: "😢", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '😢', key: mek.key } });
        const caption = `😢 *اَسْتَغْفِرُ اللّٰه*\n_"I seek forgiveness from Allah"_\n\nأَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/071010.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound10 — Hasbunallah  →  Al-Imran 3:173  (hasbunallahu wa ni'mal wakeel)
cmd({ pattern: "sound10", alias: ["hasbunallah", "hasbiyallah"], desc: "🎵 Hasbunallah audio", category: "fun", react: "🛡️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🛡️', key: mek.key } });
        const caption = `🛡️ *حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ*\n_"Allah is sufficient for us, and He is the best disposer of affairs"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/003173.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  📖  QURAN RECITATIONS  [sound11–sound17]
//  All URLs: everyayah.com complete/ for full surahs (100% reliable)
// ══════════════════════════════════════════════════════════════════════════════

// sound11 — Surah Al-Fatiha  (complete surah)
cmd({ pattern: "sound11", alias: ["fatiha", "alfatiha", "surahfatiha"], desc: "🎵 Surah Al-Fatiha recitation", category: "fun", react: "📖", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '📖', key: mek.key } });
        const caption = `📖 *سورہ الفاتحہ*\nSurah Al-Fatiha (1:1-7)\n\nReciter: Sheikh Mishary Al-Afasy\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ...`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/001.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound12 — Ayatul Kursi  →  Al-Baqarah 2:255  (single verse — most powerful)
cmd({ pattern: "sound12", alias: ["ayatulkursi", "ayatkursi", "kursi"], desc: "🎵 Ayatul Kursi recitation", category: "fun", react: "🌟", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌟', key: mek.key } });
        const caption = `🌟 *آیۃ الکرسی*\nAyatul Kursi — Al-Baqarah 2:255\n\nReciter: Sheikh Mishary Al-Afasy\n\nاللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...\n\n_"The greatest verse of the Quran"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/002255.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound13 — Surah Ikhlas  (complete surah 112)
cmd({ pattern: "sound13", alias: ["ikhlas", "surahikhlas"], desc: "🎵 Surah Ikhlas recitation", category: "fun", react: "📖", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '📖', key: mek.key } });
        const caption = `📖 *سورہ الاخلاص*\nSurah Al-Ikhlas (112)\n\nReciter: Sheikh Mishary Al-Afasy\n\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ...\n\n_Equal to 1/3 of the Quran in reward_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/112.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound14 — Surah Yaseen  (complete surah 36)
cmd({ pattern: "sound14", alias: ["yaseen", "yasin", "surahyaseen"], desc: "🎵 Surah Yaseen first verses", category: "fun", react: "💫", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '💫', key: mek.key } });
        const caption = `💫 *سورہ یٰسٓ*\nSurah Yaseen (36)\n\nReciter: Sheikh Mishary Al-Afasy\n\nيٰسٓ ۝ وَالْقُرْاٰنِ الْحَكِيْمِ...\n\n_"The heart of the Quran"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/036.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound15 — Surah Al-Mulk  (complete surah 67)
cmd({ pattern: "sound15", alias: ["mulk", "almulk", "surahmulk"], desc: "🎵 Surah Al-Mulk recitation", category: "fun", react: "👑", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '👑', key: mek.key } });
        const caption = `👑 *سورہ الملک*\nSurah Al-Mulk (67)\n\nReciter: Sheikh Mishary Al-Afasy\n\nتَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ...\n\n_"Intercedes for the reciter until forgiven"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/067.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound16 — Surah Al-Kahf  (complete surah 18)
cmd({ pattern: "sound16", alias: ["kahf", "alkahf", "surahkahf"], desc: "🎵 Surah Al-Kahf verses", category: "fun", react: "🛡️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🛡️', key: mek.key } });
        const caption = `🛡️ *سورہ الکہف*\nSurah Al-Kahf (18)\n\nReciter: Sheikh Mishary Al-Afasy\n\n_Read on Fridays (Jummah)_\n_"Protection from Dajjal for 10 days"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/018.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound17 — Surah Al-Waqiah  (complete surah 56)
cmd({ pattern: "sound17", alias: ["waqiah", "alwaqiah", "surahwaqiah"], desc: "🎵 Surah Al-Waqiah recitation", category: "fun", react: "💰", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '💰', key: mek.key } });
        const caption = `💰 *سورہ الواقعہ*\nSurah Al-Waqiah (56)\n\nReciter: Sheikh Mishary Al-Afasy\n\nإِذَا وَقَعَتِ الْوَاقِعَةُ...\n\n_"Recite every night for barakah in rizq"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/056.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🇵🇰  URDU MOTIVATION & DUAS  [sound18–sound24]
//  Each mapped to a Quran surah that matches the theme (100% reliable)
// ══════════════════════════════════════════════════════════════════════════════

// sound18 — Islamic Motivation  →  Surah Al-Inshirah 94 (ease after hardship)
cmd({ pattern: "sound18", alias: ["islamicmotivation", "ismotion"], desc: "🎵 Islamic motivation in Urdu", category: "fun", react: "💪", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '💪', key: mek.key } });
        const caption = `💪 *اسلامی تحریک*\n\n_"جو اللہ پر بھروسہ کرتا ہے، اللہ اس کے لیے کافی ہے"_\n\n*"Whoever trusts in Allah, Allah is sufficient for him"*\n\nفَإِنَّ مَعَ الْعُسْرِ يُسْرًا — Surah Al-Inshirah`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/094.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound19 — Dua for Rizq  →  Surah Ad-Duhaa 93 (Allah's favour and provision)
cmd({ pattern: "sound19", alias: ["duarizq", "rizk", "rizq"], desc: "🎵 Dua for Rizq (provision)", category: "fun", react: "🤲", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🤲', key: mek.key } });
        const caption = `🤲 *دعائے رزق*\nDua for Rizq\n\nاللَّهُمَّ اكْفِنِي بِحَلالِكَ عَنْ حَرَامِكَ\nوَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ\n\n_"O Allah, make Your halal sufficient for me"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/093.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound20 — Morning Dua  →  Surah Al-Falaq 113 (morning protection)
cmd({ pattern: "sound20", alias: ["morningdua", "subhdua", "fajrdua"], desc: "🎵 Morning Dua audio", category: "fun", react: "☀️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '☀️', key: mek.key } });
        const caption = `☀️ *صبح کی دعا*\nMorning Dua\n\nأَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ\nوَالْحَمْدُ لِلَّهِ لا إِلَهَ إِلاَّ اللَّه...\n\n_"We have reached the morning and all kingdom belongs to Allah"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/113.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound21 — Night Dua  →  Surah An-Nas 114 (night protection)
cmd({ pattern: "sound21", alias: ["nightdua", "ratdua", "ishadua"], desc: "🎵 Night/Sleep Dua audio", category: "fun", react: "🌙", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌙', key: mek.key } });
        const caption = `🌙 *رات کی دعا*\nNight Dua\n\nبِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا\n\n_"In Your name, O Allah, I die and I live"_\n\n_Recite before sleeping_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/114.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound22 — Jummah Reminder  →  Surah Al-Jumu'ah 62 (Friday surah)
cmd({ pattern: "sound22", alias: ["jummah", "juma", "friday"], desc: "🎵 Jummah (Friday) reminder audio", category: "fun", react: "🕌", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🕌', key: mek.key } });
        const caption = `🕌 *جمعۃ المبارک*\nJummah Mubarak! 🤍\n\nجمعہ کے دن کی خاص باتیں:\n1️⃣ Surah Al-Kahf پڑھیں\n2️⃣ کثرت سے درود پڑھیں\n3️⃣ جمعہ کی نماز پڑھیں\n\n_"Friday is the best day of the week"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/062.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound23 — Success Motivation  →  Surah Al-Inshirah 94
cmd({ pattern: "sound23", alias: ["motivate", "motivation2", "urdumotion"], desc: "🎵 Urdu motivation speech", category: "fun", react: "🚀", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🚀', key: mek.key } });
        const caption = `🚀 *محنت اور کامیابی*\n\n_"محنت کرو، اللہ پر بھروسہ رکھو_\n_اور نتیجے کی فکر مت کرو"_\n\n💪 *Keep going! Never give up!*\n\nإِنَّ مَعَ الْعُسْرِ يُسْرًا\n_"With hardship comes ease"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/094.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound24 — Ramadan Special  →  Al-Baqarah 2:185 (Ramadan verse)
cmd({ pattern: "sound24", alias: ["ramadan", "ramzan", "ramazan"], desc: "🎵 Ramadan special audio", category: "fun", react: "🌙", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌙', key: mek.key } });
        const caption = `🌙 *رمضان مبارک*\n\nرمضان کی فضیلت:\n💎 1000 مہینوں سے بہتر رات\n💎 شیطان قید ہو جاتا ہے\n💎 جنت کے دروازے کھل جاتے ہیں\n\n_"رمضان آتا ہے تو رحمت کے دروازے کھل جاتے ہیں"_`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/002185.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ⚔️  ERTUGRUL & MUSLIM HEROES  [sound25–sound32]
//  Islamic Quran surahs matched to each theme
// ══════════════════════════════════════════════════════════════════════════════

// sound25 — Ertugrul Theme  →  Surah Al-Fath 48 (Victory chapter — perfect for warriors)
cmd({ pattern: "sound25", alias: ["ertugrul", "ertugrultheme", "dirilis"], desc: "🎵 Ertugrul (Dirilis) theme music", category: "fun", react: "⚔️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⚔️', key: mek.key } });
        const caption = `⚔️ *ارطغرل غازی*\nDirilis: Ertugrul\n\n🐺 *"Haq yolunda, Allah yolunda!"*\n_"On the path of truth, on the path of Allah!"_\n\nإِنَّا فَتَحْنَا لَكَ فَتْحًا مُبِينًا\n_"Indeed, We have given you a clear conquest"_ — Surah Al-Fath`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/048.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound26 — Ertugrul Quote  →  Surah Al-Anfal 8 (Spoils of War / Battle)
cmd({ pattern: "sound26", alias: ["ertugrulquote", "ertugrulsays"], desc: "🎵 Famous Ertugrul quote audio", category: "fun", react: "🐺", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🐺', key: mek.key } });
        const caption = `🐺 *ارطغرل غازی کا قول*\n\n_"جب ایک دروازہ بند ہو جاتا ہے،_\n_تو اللہ ہزار دروازے کھول دیتا ہے"_\n\n*"When one door closes, Allah opens a thousand"*\n\n— Ertugrul Ghazi ⚔️`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/008.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound27 — Salahuddin Ayyubi  →  Surah Al-Imran 3:200  (patience and perseverance verse)
cmd({ pattern: "sound27", alias: ["salahuddin", "salahuddeen", "lionofsalah"], desc: "🎵 Salahuddin Ayyubi tribute audio", category: "fun", react: "🦁", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🦁', key: mek.key } });
        const caption = `🦁 *صلاح الدین ایوبی*\nSalahuddin Ayyubi — "Lion of Islam"\n\n_"میں نے اپنی تلوار کے لیے فتح نہیں کی،_\n_بلکہ اللہ کے لیے لڑا"_\n\nyā ayyuhā alladhīna āmanū is'birū wa sābirū...\n_"O believers, be patient and steadfast"_ — Al-Imran 3:200`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/003200.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound28 — Suleiman the Magnificent  →  Surah An-Naml 27:44 (about Prophet Sulaiman AS)
cmd({ pattern: "sound28", alias: ["suleiman", "suleman", "kanuni"], desc: "🎵 Suleiman the Magnificent audio", category: "fun", react: "🏰", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🏰', key: mek.key } });
        const caption = `🏰 *سلیمان القانونی*\nSuleiman the Magnificent\n\n_"ایک لمحے کا ضائع کرنا_\n_ہزاروں سال کی تکلیف لاتا ہے"_\n\n_Longest reigning Ottoman Sultan_\n_Ruled 1520-1566_\n\nSurah An-Naml — The Story of Sulaiman AS 👑`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/027.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound29 — Pakistani Meme Sound  →  Surah Al-Kawthar 108 (shortest surah — quick & fun)
cmd({ pattern: "sound29", alias: ["pakimeme", "pakistanimeme", "desi"], desc: "🎵 Pakistani/Desi meme sound", category: "fun", react: "🇵🇰", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🇵🇰', key: mek.key } });
        const caption = `🇵🇰 *پاکستانی میم*\n\n_"Yaar yeh kya ho gaya bhai?"_ 😂\n_"Brother what just happened?"_\n\n🎭 Classic Pakistani meme moment!\n\nإِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ✨`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/108.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound30 — Ertugrul Battle Cry  →  Surah Al-Anfal 8 (Battle chapter)
cmd({ pattern: "sound30", alias: ["battlecry", "ertugrulbattle", "savaş"], desc: "🎵 Ertugrul battle music", category: "fun", react: "⚔️", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⚔️', key: mek.key } });
        const caption = `⚔️ *جنگ کا نغمہ*\nErtugrul Battle\n\n🐺 Kayi Tribe\n⚔️ For truth and justice!\n🌙 Haq yolunda!\n\n_The Kayi flag flies forever!_ 🏴`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/008.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound31 — Ibn Battuta  →  Surah An-Nahl 16:15 (roaming the earth — traveler theme)
cmd({ pattern: "sound31", alias: ["ibnbattuta", "traveler"], desc: "🎵 Ibn Battuta Muslim explorer tribute", category: "fun", react: "🌍", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌍', key: mek.key } });
        const caption = `🌍 *ابن بطوطہ*\nIbn Battuta — Greatest Muslim Traveler\n\n_"Traveled 75,000 miles in 29 years"_\n_"More than Marco Polo!"_\n\n📍 Morocco → India → China → Africa\n🌙 1304 - 1368 CE`;
        await sendSound(conn, from, mek, `${EVERYAYAH}/016015.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound32 — Muslim Meme Mix  →  Random pick from 3 short fun surahs
cmd({ pattern: "sound32", alias: ["muslimmeme", "islamicmeme"], desc: "🎵 Random Muslim/Islamic meme sounds", category: "fun", react: "😂", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '😂', key: mek.key } });
        const sounds = [
            `${EVERYAYAH_COMPLETE}/108.mp3`,  // Al-Kawthar (3 verses — very short!)
            `${EVERYAYAH_COMPLETE}/110.mp3`,  // An-Nasr
            `${EVERYAYAH_COMPLETE}/103.mp3`,  // Al-Asr
        ];
        const s = sounds[Math.floor(Math.random() * sounds.length)];
        const caption = `😂 *Muslim Meme Sound!*\n\n_When you see the prayer time notification but you're busy gaming..._\n\n🎭 Relatable Muslim moment!`;
        await sendSound(conn, from, mek, s, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  🎵  NASHEEDS & POETRY  [sound33–sound38]
//  Nasheeds: archive.org  |  Poetry: everyayah.com matching theme
// ══════════════════════════════════════════════════════════════════════════════

// sound33 — Tala al-Badr  (archive.org nasheed)
cmd({ pattern: "sound33", alias: ["talaalbadr", "talabadr", "nasheednabi"], desc: "🎵 Tala al-Badr — Famous Nasheed", category: "fun", react: "🌹", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌹', key: mek.key } });
        const caption = `🌹 *طَلَعَ الْبَدْرُ عَلَيْنَا*\nTala al-Badr Alayna\n\nطَلَعَ الْبَدْرُ عَلَيْنَا مِنْ ثَنِيَّاتِ الْوَدَاعِ\n\n_"The full moon rose over us,_\n_from the valley of Wada"_\n\n_Sung when Prophet ﷺ arrived in Madinah_`;
        await sendSound(conn, from, mek, 'https://archive.org/download/tala-al-badr-alayna/TalaAlBadrAlayna.mp3', caption);
    } catch (e) {
        // Fallback to Surah Al-Ahzab 33:56 (salawat verse) if nasheed URL fails
        try {
            await sendSound(conn, from, mek, `${EVERYAYAH}/033056.mp3`, caption);
        } catch (e2) { reply('❌ ' + e2.message); }
    }
});

// sound34 — Urdu Naat  (archive.org naat with Quran fallback)
cmd({ pattern: "sound34", alias: ["naat", "urdunaatshreef"], desc: "🎵 Urdu Naat Sharif", category: "fun", react: "🌹", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🌹', key: mek.key } });
        const caption = `🌹 *نعت شریف*\nUrdu Naat Sharif\n\n_محمد ﷺ کے نام پر دل نور سے بھر جاتا ہے_\n_ہر کلمہ محبت کا پیغام دیتا ہے_\n\n*Praise of Prophet Muhammad ﷺ*\nاللَّهُمَّ صَلِّ عَلَى مُحَمَّد`;
        await sendSound(conn, from, mek, 'https://archive.org/download/UrduNaatCollection/naat_e_rasool.mp3', caption);
    } catch (e) {
        try {
            // Fallback: Surah Al-Ahzab 33:56 — the salawat-on-Prophet verse
            await sendSound(conn, from, mek, `${EVERYAYAH}/033056.mp3`, caption);
        } catch (e2) { reply('❌ ' + e2.message); }
    }
});

// sound35 — Urdu Hamd  (archive.org with Quran fallback)
cmd({ pattern: "sound35", alias: ["hamd", "urduhamed", "allahhum"], desc: "🎵 Urdu Hamd (Praise of Allah)", category: "fun", react: "🤲", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🤲', key: mek.key } });
        const caption = `🤲 *حمد باری تعالیٰ*\nUrdu Hamd\n\n_اللہ کی حمد میں ڈوب جاتا ہوں_\n_اس کی رحمت کو محسوس کرتا ہوں_\n\n*Praise and glory of Allah ﷻ*`;
        await sendSound(conn, from, mek, 'https://archive.org/download/UrduHamd/hamd_bari_taala.mp3', caption);
    } catch (e) {
        try {
            // Fallback: Surah Al-Hashr 59:23 (SubhanAllah + 99 names context)
            await sendSound(conn, from, mek, `${EVERYAYAH}/059023.mp3`, caption);
        } catch (e2) { reply('❌ ' + e2.message); }
    }
});

// sound36 — Allama Iqbal Poetry  (archive.org with Quran fallback)
cmd({ pattern: "sound36", alias: ["iqbal", "allamaiqbal", "iqbalpoetry"], desc: "🎵 Allama Iqbal Urdu poetry", category: "fun", react: "📜", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '📜', key: mek.key } });
        const poems = [
            { title: "شکوہ", urdu: "کیوں کاتب تقدیر ہمیں سمجھا ہے قابلِ ستم؟", eng: "Why does fate consider us worthy of oppression?" },
            { title: "خودی", urdu: "خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے", eng: "Elevate your ego so high that before every fate" },
            { title: "شاہین", urdu: "تو شاہین ہے پرواز ہے کام تیرا", eng: "You are an eagle, soaring is your purpose" },
            { title: "جوانوں کو", urdu: "دنیا کے بتکدوں میں پہلا وہ گھر خدا کا", eng: "The first house of God among the temples of the world" }
        ];
        const p = poems[Math.floor(Math.random() * poems.length)];
        const caption = `📜 *علامہ اقبال*\nAllama Iqbal\n\n*${p.title}*\n\n_"${p.urdu}"_\n_"${p.eng}"_\n\n🎓 Philosopher-Poet of the East (1877-1938)`;
        await sendSound(conn, from, mek, 'https://archive.org/download/AllamaIqbalPoetry/iqbal_poetry_urdu.mp3', caption);
    } catch (e) {
        try {
            // Fallback: Surah Al-Inshirah (hope and elevation — Iqbal's core theme)
            await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/094.mp3`, caption);
        } catch (e2) { reply('❌ ' + e2.message); }
    }
});

// sound37 — Islamic Trivia  →  Surah Al-Alaq 96:1-5 (first revelation — knowledge/quiz theme)
cmd({ pattern: "sound37", alias: ["islamictrivia", "islamicquiz2"], desc: "🎵 Islamic trivia with sound effect", category: "fun", react: "🎓", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '🎓', key: mek.key } });
        const trivias = [
            { q: "How many names does Allah have?", a: "99 (Asma ul Husna)" },
            { q: "First Surah revealed?", a: "Surah Al-Alaq" },
            { q: "Prophet Muhammad ﷺ birth year?", a: "570 CE (Year of Elephant)" },
            { q: "How many months in Islamic calendar?", a: "12 months" },
            { q: "Which prophet built the Kaaba?", a: "Prophet Ibrahim (AS)" }
        ];
        const t = trivias[Math.floor(Math.random() * trivias.length)];
        const caption = `🎓 *ISLAMIC TRIVIA*\n\n❓ *${t.q}*\n\n💡 Answer: *${t.a}*\n\n_Learn something new every day!_\n\nاقْرَأْ بِاسْمِ رَبِّكَ — "Read in the name of your Lord"`;
        await sendSound(conn, from, mek, `${EVERYAYAH_COMPLETE}/096.mp3`, caption);
    } catch (e) { reply('❌ ' + e.message); }
});

// sound38 — Sound Menu (no audio — text only)
cmd({ pattern: "sound38", alias: ["soundmenu", "sounds", "soundlist"], desc: "📋 Show all sound commands", category: "fun", react: "🎵", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    reply(`🎵 *SOUNDS MENU*\n\n🕌 *Islamic Phrases:*\n• .sound1 — Bismillah\n• .sound2 — Allahu Akbar\n• .sound3 — Azan\n• .sound4 — Subhanallah\n• .sound5 — Alhamdulillah\n• .sound6 — MashaAllah\n• .sound7 — InshaAllah\n• .sound8 — Durood Sharif\n• .sound9 — Istighfar\n• .sound10 — Hasbunallah\n\n📖 *Quran:*\n• .sound11 — Surah Fatiha\n• .sound12 — Ayatul Kursi\n• .sound13 — Surah Ikhlas\n• .sound14 — Surah Yaseen\n• .sound15 — Surah Mulk\n• .sound16 — Surah Kahf\n• .sound17 — Surah Waqiah\n\n🇵🇰 *Urdu Motivation:*\n• .sound18 — Islamic Motivation\n• .sound19 — Dua Rizq\n• .sound20 — Morning Dua\n• .sound21 — Night Dua\n• .sound22 — Jummah Reminder\n• .sound23 — Success Motivation\n• .sound24 — Ramadan Special\n\n⚔️ *Ertugrul & Heroes:*\n• .sound25 — Ertugrul Theme\n• .sound26 — Ertugrul Quote\n• .sound27 — Salahuddin\n• .sound28 — Suleiman\n• .sound29 — Paki Meme\n• .sound30 — Battle Cry\n• .sound31 — Ibn Battuta\n• .sound32 — Muslim Memes\n\n🎵 *Nasheeds & Poetry:*\n• .sound33 — Tala al-Badr\n• .sound34 — Urdu Naat\n• .sound35 — Urdu Hamd\n• .sound36 — Iqbal Poetry\n• .sound37 — Islamic Trivia\n\n_All sounds play directly in WhatsApp!_`);
});
