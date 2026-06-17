const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function reply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload).catch(() => interaction.channel?.send(payload));
  }
  return interaction.reply(payload).catch(() => interaction.channel?.send(payload));
}

const helpEmbed = () => new EmbedBuilder()
  .setColor('#5865F2')
  .setAuthor({ name: '🎵 RexoX Music — Command Reference' })
  .setDescription('Prefix: `!` | Slash: `/` | Both work for all commands!')
  .addFields(
    {
      name: '▶️ Playback',
      value: [
        '`/play` `!p` — Play a song or YouTube URL/playlist',
        '`/pause` `!pause` — Pause the song',
        '`/resume` `!r` — Resume playback',
        '`/stop` `!stop` / `!leave` — Stop and disconnect',
        '`/skip` `!s` — Skip current song (or N songs)',
        '`/seek` `!seek` — Seek to timestamp (e.g. 1:30)',
      ].join('\n'),
    },
    {
      name: '📋 Queue',
      value: [
        '`/queue` `!q` — Show the queue',
        '`/nowplaying` `!np` — Show current song info',
        '`/clearqueue` `!cq` — Clear queue (keep current)',
        '`/remove` `!rm` — Remove song by position',
        '`/jump` `!j` — Jump to position in queue',
        '`/shuffle` `!mix` — Shuffle the queue',
      ].join('\n'),
    },
    {
      name: '⚙️ Settings',
      value: [
        '`/volume` `!vol` — Set volume (0–200%)',
        '`/loop` `!loop` — Loop: `none` / `song` / `queue`',
        '`/autoplay` `!ap` — Toggle autoplay mode',
        '`/247` `!247` — Toggle 24/7 stay-in-channel mode',
      ].join('\n'),
    },
    {
      name: '🔍 Discovery',
      value: [
        '`/search` `!sc` — Search YouTube & pick a result',
      ].join('\n'),
    },
  )
  .setFooter({ text: 'RexoX Music 🎵 • Made with ❤️' });

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all RexoX Music commands'),
  name: 'help',
  aliases: ['h', 'commands', 'cmd'],

  async execute(interaction, client) {
    return reply(interaction, { embeds: [helpEmbed()] });
  },

  async run(message, args, client) {
    return message.reply({ embeds: [helpEmbed()] });
  },
};
