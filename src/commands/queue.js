const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, infoEmbed, nowPlayingEmbed, queueEmbed } = require('../utils/embeds');

function getQueue(client, guildId) { return client.queues.get(guildId); }
function reply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload).catch(() => interaction.channel?.send(payload));
  }
  return interaction.reply(payload).catch(() => interaction.channel?.send(payload));
}

// ══════════════════════════════════════════════════════════════════════════════
// QUEUE
// ══════════════════════════════════════════════════════════════════════════════
module.exports.queue = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1)),
  name: 'queue',
  aliases: ['q'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const page = interaction.options.getInteger('page') || 1;
    return reply(interaction, { embeds: [queueEmbed(queue, page)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const page = parseInt(args[0]) || 1;
    return message.reply({ embeds: [queueEmbed(queue, page)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// NOW PLAYING
// ══════════════════════════════════════════════════════════════════════════════
module.exports.nowplaying = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing song'),
  name: 'nowplaying',
  aliases: ['np', 'current'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    return reply(interaction, { embeds: [nowPlayingEmbed(queue.current, queue)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    return message.reply({ embeds: [nowPlayingEmbed(queue.current, queue)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// VOLUME
// ══════════════════════════════════════════════════════════════════════════════
module.exports.volume = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set or check the volume')
    .addIntegerOption(o =>
      o.setName('level').setDescription('Volume 0-200').setMinValue(0).setMaxValue(200)
    ),
  name: 'volume',
  aliases: ['vol', 'v'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    const level = interaction.options.getInteger('level');
    if (!level && level !== 0) {
      return reply(interaction, { embeds: [infoEmbed(`Current volume: **${queue?.volume ?? 50}%**`)] });
    }
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const vol = queue.setVolume(level);
    return reply(interaction, { embeds: [successEmbed(`Volume set to **${vol}%**`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    const level = parseInt(args[0]);
    if (isNaN(level)) {
      return message.reply({ embeds: [infoEmbed(`Current volume: **${queue?.volume ?? 50}%**`)] });
    }
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const vol = queue.setVolume(level);
    return message.reply({ embeds: [successEmbed(`Volume set to **${vol}%**`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// LOOP
// ══════════════════════════════════════════════════════════════════════════════
module.exports.loop = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption(o =>
      o.setName('mode')
       .setDescription('Loop mode')
       .setRequired(true)
       .addChoices(
         { name: 'Off', value: 'none' },
         { name: 'Song', value: 'song' },
         { name: 'Queue', value: 'queue' },
       )
    ),
  name: 'loop',
  aliases: ['repeat'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const mode = interaction.options.getString('mode');
    queue.loop = mode;
    const icons = { none: '➡️', song: '🔂', queue: '🔁' };
    return reply(interaction, { embeds: [successEmbed(`Loop mode set to: **${icons[mode]} ${mode}**`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const modes = ['none', 'song', 'queue'];
    const mode = modes.includes(args[0]?.toLowerCase()) ? args[0].toLowerCase() : 'none';
    queue.loop = mode;
    const icons = { none: '➡️', song: '🔂', queue: '🔁' };
    return message.reply({ embeds: [successEmbed(`Loop mode set to: **${icons[mode]} ${mode}**`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SHUFFLE
// ══════════════════════════════════════════════════════════════════════════════
module.exports.shuffle = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue'),
  name: 'shuffle',
  aliases: ['mix'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue || queue.songs.length <= 1) return reply(interaction, { embeds: [errorEmbed('Not enough songs in queue!')] });
    if (!queue.shuffle()) return reply(interaction, { embeds: [errorEmbed('Could not shuffle!')] });
    return reply(interaction, { embeds: [successEmbed('Queue shuffled! 🔀')] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue || queue.songs.length <= 1) return message.reply({ embeds: [errorEmbed('Not enough songs in queue!')] });
    queue.shuffle();
    return message.reply({ embeds: [successEmbed('Queue shuffled! 🔀')] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// REMOVE
// ══════════════════════════════════════════════════════════════════════════════
module.exports.remove = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue')
    .addIntegerOption(o =>
      o.setName('position').setDescription('Song position in queue').setRequired(true).setMinValue(2)
    ),
  name: 'remove',
  aliases: ['rm', 'del'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const pos = interaction.options.getInteger('position');
    const removed = queue.remove(pos - 1);
    if (!removed) return reply(interaction, { embeds: [errorEmbed('Invalid position!')] });
    return reply(interaction, { embeds: [successEmbed(`Removed **${removed.title}** from the queue!`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const pos = parseInt(args[0]);
    if (isNaN(pos)) return message.reply({ embeds: [errorEmbed('Provide a valid position!')] });
    const removed = queue.remove(pos - 1);
    if (!removed) return message.reply({ embeds: [errorEmbed('Invalid position!')] });
    return message.reply({ embeds: [successEmbed(`Removed **${removed.title}** from the queue!`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// JUMP
// ══════════════════════════════════════════════════════════════════════════════
module.exports.jump = {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('Jump to a specific song in the queue')
    .addIntegerOption(o =>
      o.setName('position').setDescription('Position to jump to').setRequired(true).setMinValue(2)
    ),
  name: 'jump',
  aliases: ['j'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const pos = interaction.options.getInteger('position');
    if (!queue.jump(pos - 1)) return reply(interaction, { embeds: [errorEmbed('Invalid position!')] });
    return reply(interaction, { embeds: [successEmbed(`Jumped to position **#${pos}**!`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const pos = parseInt(args[0]);
    if (isNaN(pos) || !queue.jump(pos - 1)) return message.reply({ embeds: [errorEmbed('Invalid position!')] });
    return message.reply({ embeds: [successEmbed(`Jumped to position **#${pos}**!`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CLEAR QUEUE
// ══════════════════════════════════════════════════════════════════════════════
module.exports.clearqueue = {
  data: new SlashCommandBuilder().setName('clearqueue').setDescription('Clear all songs from the queue (except current)'),
  name: 'clearqueue',
  aliases: ['cq', 'clear'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const count = queue.clear();
    return reply(interaction, { embeds: [successEmbed(`Cleared **${count}** song(s) from the queue!`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const count = queue.clear();
    return message.reply({ embeds: [successEmbed(`Cleared **${count}** song(s) from the queue!`)] });
  },
};
