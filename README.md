# 🎵 RexoX Music Bot

A powerful Discord music bot that plays from YouTube with both slash commands (`/play`) and prefix commands (`!p`). Host it on Railway.app for free 24/7 uptime.

---

## ✨ Features

| Feature | Command |
|---|---|
| Play from YouTube URL or name | `/play` `!p` |
| Pause / Resume | `/pause` `/resume` `!pause` `!r` |
| Skip songs (1 or N) | `/skip [count]` `!s [count]` |
| Stop & disconnect | `/stop` `!stop` `!leave` |
| Queue with pagination | `/queue [page]` `!q [page]` |
| Now Playing info | `/nowplaying` `!np` |
| Clear Queue | `/clearqueue` `!cq` |
| Remove song by position | `/remove <pos>` `!rm <pos>` |
| Jump to queue position | `/jump <pos>` `!j <pos>` |
| Shuffle the queue | `/shuffle` `!mix` |
| Volume control (0–200%) | `/volume <level>` `!vol <level>` |
| Loop: off / song / queue | `/loop <mode>` `!loop <mode>` |
| **Autoplay** (related songs) | `/autoplay` `!ap` |
| **24/7 mode** (stay in VC) | `/247` `!247` |
| Seek to timestamp | `/seek <time>` `!seek <time>` |
| YouTube search & pick | `/search <query>` `!sc <query>` |
| Playlist support | `/play <playlist URL>` |
| Help menu | `/help` `!help` |

---

## 🚀 Setup Guide

### Step 1 — Create Your Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `RexoX Music`
3. Go to **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent**
   - ✅ **Server Members Intent**
5. Copy your **Bot Token** (keep it secret!)
6. Go to **OAuth2 → General** and copy your **Client ID**

### Step 2 — Invite the Bot to Your Server

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Or build a custom invite with these permissions:
- Send Messages, Embed Links, Read Message History
- Connect, Speak, Use Voice Activity
- Add Reactions

### Step 3 — Deploy to Railway.app

1. Push this project to a **GitHub repository**
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Go to **Variables** tab and add:

| Variable | Value |
|---|---|
| `DISCORD_TOKEN` | Your bot token from Step 1 |
| `CLIENT_ID` | Your application client ID |
| `DEFAULT_VOLUME` | `50` (optional) |
| `INACTIVITY_TIMEOUT` | `300000` (5 min, optional) |

5. Railway will automatically build and start the bot!

> ⚠️ **Important:** Make sure your Railway service is set to **Worker** type (not Web), since the bot doesn't need an HTTP server.

### Step 4 — Test It!

In your Discord server:
```
!help
!p Never Gonna Give You Up
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

---

## 📖 Command Reference

### Playback
```
!p <song name or URL>   — Play a song or YouTube link
!p <playlist URL>       — Queue an entire YouTube playlist
!pause                  — Pause playback
!r / !resume            — Resume playback
!s / !skip [N]          — Skip 1 or N songs
!stop / !leave          — Stop music and disconnect
!seek 1:30              — Seek to 1 minute 30 seconds
```

### Queue Management
```
!q [page]               — Show queue (paginated)
!np                     — Now Playing details
!cq / !clear            — Clear the queue
!rm <position>          — Remove song at position
!j <position>           — Jump to position
!mix / !shuffle         — Shuffle the queue
```

### Settings
```
!vol 75                 — Set volume to 75%
!loop song              — Loop current song
!loop queue             — Loop the whole queue
!loop none              — Disable looping
!ap / !autoplay         — Toggle autoplay
!247                    — Toggle 24/7 mode
```

### Discovery
```
!sc <query>             — Search YouTube and pick a result (react with 1️⃣-5️⃣)
!find <query>           — Same as !sc
```

---

## 🔧 Local Development

```bash
# Clone the repo
git clone https://github.com/your-username/rexox-music
cd rexox-music

# Install dependencies
npm install

# Copy env file and fill in your token
cp .env.example .env

# Start the bot
npm start

# Or with auto-reload
npm run dev
```

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| Bot doesn't respond to `!` commands | Enable **Message Content Intent** in Developer Portal |
| Slash commands not showing | Wait up to 1 hour for global registration, or use guild commands for instant |
| Bot can't join voice | Check **Connect** and **Speak** permissions in the channel |
| Song won't play | Try a direct YouTube URL instead of a search name |
| Railway crashes | Check logs; ensure `DISCORD_TOKEN` is set correctly |

---

## 📦 Tech Stack

- **discord.js** v14 — Discord API
- **@discordjs/voice** — Voice connection
- **play-dl** — YouTube streaming (no API key needed!)
- **ffmpeg-static** — Audio encoding
- **Railway.app** — Hosting

---

*RexoX Music 🎵 — Built with ❤️*
