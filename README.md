
---

## Steps to Deploy

### Step 1: Fork the Repository

Click the button below to fork the TEDDY XMD repository to your GitHub account:

<div align="center">
  <a href="https://github.com/Teddytech1/TEDDY-XMD/fork">
    <img src="https://img.shields.io/badge/Fork-Repo-orange?style=for-the-badge" alt="Fork the repository"/>
  </a>
</div>

---

### Step 2: Get Pair Code

Easily connect to your WhatsApp account by pair code.

<div align="center">
  <a href="https://pair-teddy-xmd-bot-ru7s.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/SESSION-ID-ff4d4d?style=for-the-badge" alt="Generate Pair Code"/>
  </a>
</div>

---


### Step 3: Set Environment Variables.


**Note:** Set these environment variables in .env file 

| Variable | Description 
|---|---| 
| REMOVEBG_KEY | API key for www.remove.bg |
| SESSION_ID | Session id you got via pairing |


**Use One Of Following ( Optional But Highly Recommended )** 

| Variable | Description 
|---|---| 
| MONGO_URL | mongo db connection uri |
| POSTGRES_URL | postgres:// postgres connection url |
| MYSQL_URL | mysql://mysql connection url |

----

### Step 4: Deploy Now

**Option A: Deploy In Heroku**
1. [Sign Up on Heroku](https://signup.heroku.com/) if you haven’t already.
2. Click the button below to deploy directly In Heroku:
   <br>
   <a href='https://heroku.com/deploy?template=https://github.com/Teddytech1/TEDDY-XMD/Bypass' target="_blank">
      <img alt='Deploy In Heroku' src='https://img.shields.io/badge/-DEPLOY%20NOW-purple?style=for-the-badge&logo=heroku&logoColor=white'/>
   </a>

**Option B: Deploy In Koyeb**
1. [Sign Up on Koyeb](https://app.koyeb.com/auth/signup). if you haven’t already.
2. Click the button below to deploy using Koyeb:
   <br>
   <a href='https://app.koyeb.com' target="_blank">
      <img alt='Deploy In Koyeb' src='https://img.shields.io/badge/-DEPLOY-red?style=for-the-badge&logo=koyeb&logoColor=white'/>
   </a>

**Option C: Deploy In Railway**
1. [Sign Up on Railway](https://railway.app/login) if you haven’t already.
2. Click the button below to deploy using Railway:
   <br>
   <a href='https://railway.app/new' target="_blank">
      <img alt='Deploy In Railway' src='https://img.shields.io/badge/-DEPLOY-purple?style=for-the-badge&logo=railway&logoColor=white'/>
   </a>

**Option D: Deploy In Render**
1. [Sign Up on Render](https://dashboard.render.com/register) if you haven’t already.
2. Click the button below to deploy using Render:
   <br>
   <a href='https://dashboard.render.com' target="_blank">
      <img alt='Deploy In Render' src='https://img.shields.io/badge/-DEPLOY-black?style=for-the-badge&logo=render&logoColor=white'/>
   </a>
   
**Option E: Deploy In Replit**
1. [Sign Up on Replit](https://repl.it) if you haven’t already.
2. Click the button below to deploy using Replit:
   <br>
   <a href='https://repl.it/github/Teddytech1/TEDDY-XMD' target="_blank">
      <img alt='Deploy In Replit' src='https://img.shields.io/badge/-DEPLOY-orange?style=for-the-badge&logo=replit&logoColor=white'/>
   </a>

**Option F: Deploy In Sevalla**
1. [Sign Up on Sevalla](https://sevalla.com/signup/) if you haven’t already.
2. Click the button below to deploy using Sevalla:
   <br>
   <a href='https://sevalla.com' target="_blank">
      <img alt='Deploy In Sevalla' src='https://img.shields.io/badge/-DEPLOY%20NOW-blue?style=for-the-badge&logo=sevalla&logoColor=white'/>
   </a>
   
**Option G: Deploy In Fly.io**
1. [Sign Up on Fly.io](https://fly.io/app/sign-up) if you haven’t already.
2. Click the button below to deploy using Fly.io:
   <br>
   <a href='https://fly.io' target="_blank">
      <img alt='Deploy In Sevalla' src='https://img.shields.io/badge/-DEPLOY%20NOW-magenta?style=for-the-badge&logo=flyio&logoColor=white'/>
   </a>

**Option H: Deploy In Panel**
1. First You Have to Sign up on discord using web or app then click below.
2. [Sign Up On Panel](https://optiklink.com/auth) if you don’t have Already.
3. Click the button below to deploy using Panel:
   <br>
   <a href='https://control.optiklink.com/' target="_blank">
      <img alt='Deploy In Panel' src='https://img.shields.io/badge/-DEPLOY-green?style=for-the-badge&logo=Cloudflare&logoColor=white'/>
   </a>

---

### Join Us

<div align="center">
  <a href="https://t.me/Xdbot1">
    <img src="https://img.shields.io/badge/Join%20Telegram-0078E7?style=for-the-badge&logo=telegram&logoColor=white" alt="Contact Dev Telegram"/>
  </a>
  <a href="https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n">
    <img src="https://img.shields.io/badge/Join%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Join WhatsApp"/>
  </a>
</div>

---

## Features

- **Tag all group members** with the `.tagall` command
- **Automated Tasks** with the `.autoreact, .autostatus, .autoread` commands
- **Admin restricted usage** (Only group admins can use certain commands)
- **Owner restricted usage** (Only owner/sudo can use certain commands)
- **Games** like Tic-Tac-Toe for interactive group engagement
- **Social Media** downloaders for popular social media webistes and apps
- **Text Makers** with `.ephoto`
- **Text-to-Speech** with `.tts`
- **Sticker creation** with `.sticker`
- **Logo creations** with `.ephoto`
- **Anti-link detection** for group safety
- **Warn and manage group members** with admin control
- **And much more .....**

---

## About

TEDDY-XMD WhatsApp Bot assists group admins by providing them with tools to efficiently manage large WhatsApp groups. The bot uses the Baileys library to interact with the WhatsApp Web API and supports multi-device features.

It is lightweight and can be easily customized to add more commands as per your requirements. The bot runs in a Node.js environment and provides QR code-based authentication to link your WhatsApp account.

---

## Self Hosting Guide

### Deploy in Termux/Ubuntu
   
```
pkg update && pkg upgrade -y && pkg install proot-distro -y
```
```
proot-distro install ubuntu
```
```
proot-distro login ubuntu
```
```
apt update && apt upgrade -y && apt install -y git ffmpeg build-essential libvips-dev curl webp nodejs npm
```
```
git clone https://github.com/<your gitHub Username>/TEDDY-XMD
cd TEDDY-XMD 
```
```
npm install && npm start
```
---

- Note if npm throws error just exit from ubuntu terminal and login again then `cd TEDDY-XMD && npm install`


## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the [LICENSE](https://github.com/Teddytech1/TEDDY-XMD/blob/main/LICENSE) file for details.

---

## Contributions

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Teddytech1/TEDDY-XMD/issues).

---

## 🌟 Show your support

If you like this project, please give it a [⭐️ star on GitHub](https://github.com/Teddytech1/TEDDY-XMD)!



## Important Warning

**Note:** This bot is created for educational purposes only. This is NOT an official WhatsApp bot. Using this bot may lead to your WhatsApp account being banned. Use it at your own risk. The developers will not be responsible for any consequences or account bans that may occur while using this bot.

## Legal Notice

- This project is not affiliated with, authorized, maintained, sponsored or endorsed by WhatsApp or any of its affiliates or subsidiaries.
- This is an independent and unofficial software. Use at your own risk.
- Do not spam people with this bot.
- Do not use this bot to send bulk messages or for illegal purposes.
- The developers assume no liability and are not responsible for any misuse or damage caused by this program.

## Copyright Notice

Copyright (c) 2026 Teddy Xmd .All rights reserved.

This project contains code from various open source projects:
- Baileys (MIT License)
- Other libraries as listed in package.json

<h2> IMPORTANT NOTICE </h2>

- Not For Sale
- If A plugin's code is obfuscated , You don't have permission to edit it in any form 
- Don't Forget to Give Credits If you are using or Reuploading My Plugins/files
- Have A Good Day

