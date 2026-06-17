const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');

// ── Helper ─────────────────────────────────────────────────────────────────────
function getQueue(client, guildId) {
  return client.queues.get(guildId);
}

function inVC(interaction) {
  return interaction.member?.voice?.channel;
}

function reply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload).catch(() => interaction.channel?.send(payload));
  }
  return interaction.reply(payload).catch(() => interaction.channel?.send(payload));
}

// ══════════════════════════════════════════════════════════════════════════════
// SKIP
// ══════════════════════════════════════════════════════════════════════════════
module.exports.skip = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song')
    .addIntegerOption(o =>
      o.setName('count').setDescription('Number of songs to skip').setMinValue(1)
    ),
  name: 'skip',
  aliases: ['s', 'next'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    if (!inVC(interaction)) return reply(interaction, { embeds: [errorEmbed('Join a voice channel first!')] });
    const count = interaction.options.getInteger('count') || 1;
    const skipped = queue.skip(count);
    return reply(interaction, { embeds: [successEmbed(`Skipped **${skipped.length}** song(s)!`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const count = parseInt(args[0]) || 1;
    const skipped = queue.skip(count);
    return message.reply({ embeds: [successEmbed(`Skipped **${skipped.length}** song(s)!`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// STOP
// ══════════════════════════════════════════════════════════════════════════════
module.exports.stop = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear the queue'),
  name: 'stop',
  aliases: ['leave', 'dc'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    if (!inVC(interaction)) return reply(interaction, { embeds: [errorEmbed('Join a voice channel first!')] });
    queue.stop();
    queue.destroy();
    return reply(interaction, { embeds: [successEmbed('Stopped music and cleared the queue!')] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    queue.stop();
    queue.destroy();
    return message.reply({ embeds: [successEmbed('Stopped music and cleared the queue!')] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PAUSE
// ══════════════════════════════════════════════════════════════════════════════
module.exports.pause = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
  name: 'pause',

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    if (!inVC(interaction)) return reply(interaction, { embeds: [errorEmbed('Join a voice channel first!')] });
    if (!queue.pause()) return reply(interaction, { embeds: [errorEmbed('Already paused!')] });
    return reply(interaction, { embeds: [successEmbed('Paused the music!')] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    if (!queue.pause()) return message.reply({ embeds: [errorEmbed('Already paused!')] });
    return message.reply({ embeds: [successEmbed('Paused the music!')] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// RESUME
// ══════════════════════════════════════════════════════════════════════════════
module.exports.resume = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
  name: 'resume',
  aliases: ['r', 'unpause'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    if (!inVC(interaction)) return reply(interaction, { embeds: [errorEmbed('Join a voice channel first!')] });
    if (!queue.resume()) return reply(interaction, { embeds: [errorEmbed('Not paused!')] });
    return reply(interaction, { embeds: [successEmbed('Resumed the music!')] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    if (!queue.resume()) return message.reply({ embeds: [errorEmbed('Not paused!')] });
    return message.reply({ embeds: [successEmbed('Resumed the music!')] });
  },
};
