const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;

    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();

    await run('git fetch --all --prune');

    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;

    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');

    return { oldRev, newRev, alreadyUpToDate };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 5) {
                return reject(new Error('Too many redirects'));
            }

            visited.add(url);

            const client = url.startsWith('https://')
                ? require('https')
                : require('http');

            const req = client.get(url, {
                headers: {
                    'User-Agent': 'TEDDY-XMD-Updater/1.0',
                    'Accept': '*/*'
                }
            }, res => {

                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;

                    if (!location) {
                        return reject(new Error(`HTTP ${res.statusCode} without Location`));
                    }

                    const nextUrl = new URL(location, url).toString();
                    res.resume();

                    return downloadFile(nextUrl, dest, visited)
                        .then(resolve)
                        .catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                const file = fs.createWriteStream(dest);

                res.pipe(file);

                file.on('finish', () => file.close(resolve));

                file.on('error', err => {
                    try { file.close(() => {}); } catch {}
                    fs.unlink(dest, () => reject(err));
                });

            });

            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });

        } catch (e) {
            reject(e);
        }
    });
}

async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, {
            text: '♻️ *TEDDY-XMD is restarting...*'
        }, { quoted: message });
    } catch {}

    try {
        await run('pm2 restart all');
        return;
    } catch {}

    setTimeout(() => {
        process.exit(0);
    }, 500);
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        return await sock.sendMessage(chatId, {
            text: '❌ Only the TEDDY-XMD owner or sudo users can use this command.'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, {
            text: '🔄 *TEDDY-XMD is updating...*\nPlease wait.'
        }, { quoted: message });

        if (await hasGitRepo()) {

            const { newRev, alreadyUpToDate } = await updateViaGit();

            await run('npm install --no-audit --no-fund');

            if (alreadyUpToDate) {
                await sock.sendMessage(chatId, {
                    text: `✅ *TEDDY-XMD is already up to date!*\n\nVersion: ${newRev}`
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `✅ *TEDDY-XMD updated successfully!*\n\nNew Version:\n${newRev}\n\n♻️ Restarting bot...`
                }, { quoted: message });
            }

        } else {

            await sock.sendMessage(chatId, {
                text: '❌ Git repository not found.\nPlease use a Git-based deployment.'
            }, { quoted: message });

            return;
        }

        await restartProcess(sock, chatId, message);

    } catch (err) {

        console.error('Update failed:', err);

        await sock.sendMessage(chatId, {
            text: `❌ *TEDDY-XMD Update Failed!*\n\n${String(err.message || err)}`
        }, { quoted: message });

    }
}

module.exports = updateCommand;