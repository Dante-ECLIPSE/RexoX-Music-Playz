const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const playdl = require('play-dl');
const { EmbedBuilder } = require('discord.js');

class MusicQueue {
  constructor(guild, textChannel, voiceChannel) {
    this.guild = guild;
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;

    this.songs = [];
    this.current = null;
    this.volume = parseInt(process.env.DEFAULT_VOLUME) || 50;
    this.loop = 'none'; // 'none' | 'song' | 'queue'
    this.autoplay = false;
    this.paused = false;
    this.is247 = false;

    this.connection = null;
    this.player = null;
    this.resource = null;
    this._inactivityTimer = null;

    this._init();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  _init() {
    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    this.player.on(AudioPlayerStatus.Idle, () => this._onIdle());
    this.player.on('error', err => {
      console.error('[Player Error]', err.message);
      this._onIdle();
    });
  }

  // ── Join Voice ────────────────────────────────────────────────────────────
  async join(voiceChannel) {
    this.voiceChannel = voiceChannel;
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
  console.log('[VOICE] Joining voice channel...');
  await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
  console.log('[VOICE] Voice connection ready!');
} catch (err) {
  console.error('[VOICE ERROR]', err);
  this.connection.destroy();
  throw err;
}
    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      if (this.is247) return; // Don't destroy on 247 mode
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  // ── Add Song ──────────────────────────────────────────────────────────────
  async addSong(songInfo, requester) {
    const song = { ...songInfo, requester };
    this.songs.push(song);
    return song;
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  async play() {
    if (this.songs.length === 0) {
      if (!this.is247) this._startInactivityTimer();
      return;
    }

    this._clearInactivityTimer();
    this.current = this.songs[0];

    try {
      let stream;

      if (this.current.url.includes('youtube.com') || this.current.url.includes('youtu.be')) {
        const info = await playdl.stream(this.current.url, { quality: 2 });
        stream = info.stream;
        this.current.type = info.type;
      } else {
        const searched = await playdl.search(this.current.url, { limit: 1 });
        if (!searched.length) throw new Error('No results found.');
        const info = await playdl.stream(searched[0].url, { quality: 2 });
        stream = info.stream;
      }

      this.resource = createAudioResource(stream, {
        inlineVolume: true,
      });
      this.resource.volume.setVolume(this.volume / 100);
      this.player.play(this.resource);
      this.paused = false;

    } catch (err) {
      console.error('[Play Error]', err.message);
      this.textChannel.send({
        embeds: [errorEmbed(`❌ Error playing **${this.current?.title}**. Skipping...`)]
      });
      this.songs.shift();
      this.play();
    }
  }

  // ── On Idle (song ended) ──────────────────────────────────────────────────
  async _onIdle() {
    if (this.loop === 'song' && this.current) {
      // replay same song
    } else if (this.loop === 'queue' && this.songs.length > 0) {
      const done = this.songs.shift();
      this.songs.push(done);
    } else {
      this.songs.shift();
    }

    if (this.songs.length === 0 && this.autoplay && this.current) {
      await this._doAutoplay();
    } else {
      this.play();
    }
  }

  // ── Autoplay ──────────────────────────────────────────────────────────────
  async _doAutoplay() {
    try {
      const related = await playdl.search(
        this.current.title.split('(')[0].split('feat')[0].trim(),
        { limit: 5, source: { youtube: 'video' } }
      );
      // pick a random one from the first 5
      const pick = related[Math.floor(Math.random() * Math.min(related.length, 5))];
      if (!pick) return this.play();

      const song = {
        title: pick.title,
        url: pick.url,
        thumbnail: pick.thumbnails?.[0]?.url,
        duration: fmtDuration(pick.durationInSec),
        durationSec: pick.durationInSec,
        requester: 'Autoplay 🤖',
      };
      this.songs.push(song);
      this.textChannel.send({
        embeds: [infoEmbed(`🔀 Autoplay: **${song.title}**`)]
      });
      this.play();
    } catch {
      this.play();
    }
  }

  // ── Skip ──────────────────────────────────────────────────────────────────
  skip(count = 1) {
    const skipped = this.songs.splice(0, Math.max(1, count));
    this.player.stop();
    return skipped;
  }

  // ── Pause / Resume ────────────────────────────────────────────────────────
  pause() {
    if (this.paused) return false;
    this.player.pause();
    this.paused = true;
    return true;
  }

  resume() {
    if (!this.paused) return false;
    this.player.unpause();
    this.paused = false;
    return true;
  }

  // ── Volume ────────────────────────────────────────────────────────────────
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(200, vol));
    if (this.resource?.volume) {
      this.resource.volume.setVolume(this.volume / 100);
    }
    return this.volume;
  }

  // ── Seek ──────────────────────────────────────────────────────────────────
  async seek(seconds) {
    if (!this.current) return false;
    try {
      const info = await playdl.stream(this.current.url, {
        quality: 2,
        seek: seconds,
      });
      this.resource = createAudioResource(info.stream, { inlineVolume: true });
      this.resource.volume.setVolume(this.volume / 100);
      this.player.play(this.resource);
      return true;
    } catch {
      return false;
    }
  }

  // ── Shuffle ───────────────────────────────────────────────────────────────
  shuffle() {
    if (this.songs.length <= 1) return false;
    const current = this.songs.shift();
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
    this.songs.unshift(current);
    return true;
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  remove(index) {
    if (index < 1 || index >= this.songs.length) return null;
    return this.songs.splice(index, 1)[0];
  }

  // ── Jump ──────────────────────────────────────────────────────────────────
  jump(index) {
    if (index < 1 || index >= this.songs.length) return false;
    this.songs.splice(1, index - 1);
    this.player.stop();
    return true;
  }

  // ── Clear Queue ───────────────────────────────────────────────────────────
  clear() {
    const count = this.songs.length - 1;
    if (this.songs.length > 1) this.songs.splice(1);
    return count;
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  stop() {
    this.songs = [];
    this.autoplay = false;
    this.loop = 'none';
    this.player.stop(true);
  }

  // ── 24/7 ──────────────────────────────────────────────────────────────────
  toggle247() {
    this.is247 = !this.is247;
    return this.is247;
  }

  // ── Destroy ───────────────────────────────────────────────────────────────
  destroy() {
    this._clearInactivityTimer();
    this.songs = [];
    this.player.stop(true);
    if (this.connection) {
      try { this.connection.destroy(); } catch {}
    }
    const client = require('./index');
  }

  // ── Inactivity Timer ──────────────────────────────────────────────────────
  _startInactivityTimer() {
    if (this.is247) return;
    this._clearInactivityTimer();
    const timeout = parseInt(process.env.INACTIVITY_TIMEOUT) || 300_000;
    this._inactivityTimer = setTimeout(() => {
      this.textChannel.send({
        embeds: [infoEmbed('⏹️ Left voice channel due to inactivity.')]
      });
      this.destroy();
    }, timeout);
  }

  _clearInactivityTimer() {
    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDuration(sec) {
  if (!sec) return 'LIVE';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

function errorEmbed(msg) {
  return new EmbedBuilder().setColor('#FF4444').setDescription(msg);
}

function infoEmbed(msg) {
  return new EmbedBuilder().setColor('#5865F2').setDescription(msg);
}

module.exports = { MusicQueue, fmtDuration };
