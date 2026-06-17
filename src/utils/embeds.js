const { EmbedBuilder } = require('discord.js');

const COLORS = {
  primary: '#5865F2',
  success: '#57F287',
  warning: '#FEE75C',
  error: '#FF4444',
  info: '#00B0F4',
};

function baseEmbed(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: 'RexoX Music 🎵', iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' })
    .setTimestamp();
}

function successEmbed(msg) {
  return baseEmbed(COLORS.success).setDescription(`✅ ${msg}`);
}

function errorEmbed(msg) {
  return baseEmbed(COLORS.error).setDescription(`❌ ${msg}`);
}

function infoEmbed(msg) {
  return baseEmbed(COLORS.info).setDescription(`ℹ️ ${msg}`);
}

function warnEmbed(msg) {
  return baseEmbed(COLORS.warning).setDescription(`⚠️ ${msg}`);
}

function nowPlayingEmbed(song, queue) {
  const bar = progressBar(0, song.durationSec);
  return baseEmbed(COLORS.primary)
    .setAuthor({ name: '🎵 Now Playing' })
    .setTitle(song.title)
    .setURL(song.url)
    .setThumbnail(song.thumbnail || null)
    .addFields(
      { name: '⏱ Duration', value: song.duration || 'LIVE', inline: true },
      { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
      { name: '🔁 Loop', value: capitalize(queue.loop), inline: true },
      { name: '📋 Queue', value: `${queue.songs.length} song(s)`, inline: true },
      { name: '🤖 Autoplay', value: queue.autoplay ? 'On' : 'Off', inline: true },
      { name: '📡 247', value: queue.is247 ? 'On' : 'Off', inline: true },
      { name: '🎤 Requested by', value: `${song.requester}`, inline: false },
    )
    .setDescription(bar);
}

function addedEmbed(song, position) {
  return baseEmbed(COLORS.success)
    .setAuthor({ name: '✅ Added to Queue' })
    .setTitle(song.title)
    .setURL(song.url)
    .setThumbnail(song.thumbnail || null)
    .addFields(
      { name: '⏱ Duration', value: song.duration || 'LIVE', inline: true },
      { name: '📍 Position', value: `#${position}`, inline: true },
      { name: '🎤 Requested by', value: `${song.requester}`, inline: true },
    );
}

function queueEmbed(queue, page = 1) {
  const perPage = 10;
  const songs = queue.songs.slice(1); // skip currently playing
  const pages = Math.max(1, Math.ceil(songs.length / perPage));
  page = Math.min(page, pages);

  const start = (page - 1) * perPage;
  const slice = songs.slice(start, start + perPage);

  const list = slice.length
    ? slice.map((s, i) => `\`${start + i + 2}.\` [${s.title}](${s.url}) — \`${s.duration}\` • ${s.requester}`).join('\n')
    : '*Queue is empty*';

  return baseEmbed(COLORS.primary)
    .setAuthor({ name: '📋 Music Queue' })
    .setTitle(queue.current ? `Now Playing: ${queue.current.title}` : 'No song playing')
    .setDescription(list)
    .addFields(
      { name: '🔁 Loop', value: capitalize(queue.loop), inline: true },
      { name: '🤖 Autoplay', value: queue.autoplay ? 'On' : 'Off', inline: true },
      { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
    )
    .setFooter({ text: `Page ${page}/${pages} • ${songs.length} song(s) in queue • RexoX Music 🎵` });
}

function progressBar(current, total, length = 20) {
  if (!total) return '`🔴 LIVE`';
  const filled = Math.round((current / total) * length);
  const bar = '▬'.repeat(filled) + '🔘' + '▬'.repeat(length - filled);
  return `\`${bar}\``;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  successEmbed, errorEmbed, infoEmbed, warnEmbed,
  nowPlayingEmbed, addedEmbed, queueEmbed,
};
