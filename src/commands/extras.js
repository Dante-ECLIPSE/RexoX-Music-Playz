const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed, successEmbed, infoEmbed } = require('../utils/embeds');
const { search } = require('../utils/resolver');

function getQueue(client, guildId) { return client.queues.get(guildId); }
function reply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload).catch(() => interaction.channel?.send(payload));
  }
  return interaction.reply(payload).catch(() => interaction.channel?.send(payload));
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTOPLAY
// ══════════════════════════════════════════════════════════════════════════════
module.exports.autoplay = {
  data: new SlashCommandBuilder().setName('autoplay').setDescription('Toggle autoplay (adds related songs when queue is empty)'),
  name: 'autoplay',
  aliases: ['ap'],

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    queue.autoplay = !queue.autoplay;
    return reply(interaction, { embeds: [successEmbed(`Autoplay is now **${queue.autoplay ? 'ON 🟢' : 'OFF 🔴'}**`)] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    queue.autoplay = !queue.autoplay;
    return message.reply({ embeds: [successEmbed(`Autoplay is now **${queue.autoplay ? 'ON 🟢' : 'OFF 🔴'}**`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// 24/7
// ══════════════════════════════════════════════════════════════════════════════
module.exports.twofourseven = {
  data: new SlashCommandBuilder().setName('247').setDescription('Toggle 24/7 mode (bot stays in voice channel permanently)'),
  name: '247',

  async execute(interaction, client) {
    let queue = getQueue(client, interaction.guild.id);
    const voiceChannel = interaction.member?.voice?.channel;

    if (!queue && !voiceChannel) {
      return reply(interaction, { embeds: [errorEmbed('Join a voice channel first!')] });
    }

    if (!queue) {
      const { MusicQueue } = require('../utils/MusicQueue');
      queue = new MusicQueue(interaction.guild, interaction.channel, voiceChannel);
      client.queues.set(interaction.guild.id, queue);
      const origDestroy = queue.destroy.bind(queue);
      queue.destroy = () => { origDestroy(); client.queues.delete(interaction.guild.id); };
      await queue.join(voiceChannel);
    }

    const enabled = queue.toggle247();
    return reply(interaction, { embeds: [successEmbed(`24/7 mode is now **${enabled ? 'ON 🟢' : 'OFF 🔴'}**`)] });
  },

  async run(message, args, client) {
    let queue = getQueue(client, message.guild.id);
    const voiceChannel = message.member?.voice?.channel;

    if (!queue && !voiceChannel) {
      return message.reply({ embeds: [errorEmbed('Join a voice channel first!')] });
    }

    if (!queue) {
      const { MusicQueue } = require('../utils/MusicQueue');
      queue = new MusicQueue(message.guild, message.channel, voiceChannel);
      client.queues.set(message.guild.id, queue);
      const origDestroy = queue.destroy.bind(queue);
      queue.destroy = () => { origDestroy(); client.queues.delete(message.guild.id); };
      await queue.join(voiceChannel);
    }

    const enabled = queue.toggle247();
    return message.reply({ embeds: [successEmbed(`24/7 mode is now **${enabled ? 'ON 🟢' : 'OFF 🔴'}**`)] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SEEK
// ══════════════════════════════════════════════════════════════════════════════
module.exports.seek = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a position in the song')
    .addStringOption(o =>
      o.setName('time').setDescription('Time (e.g. 1:30 or 90)').setRequired(true)
    ),
  name: 'seek',

  async execute(interaction, client) {
    const queue = getQueue(client, interaction.guild.id);
    if (!queue?.current) return reply(interaction, { embeds: [errorEmbed('Nothing is playing!')] });
    const timeStr = interaction.options.getString('time');
    const seconds = parseTime(timeStr);
    if (seconds === null) return reply(interaction, { embeds: [errorEmbed('Invalid time format! Use `1:30` or `90`')] });
    await interaction.deferReply();
    const ok = await queue.seek(seconds);
    return reply(interaction, { embeds: [ok ? successEmbed(`Seeked to **${timeStr}**!`) : errorEmbed('Could not seek!')] });
  },

  async run(message, args, client) {
    const queue = getQueue(client, message.guild.id);
    if (!queue?.current) return message.reply({ embeds: [errorEmbed('Nothing is playing!')] });
    const timeStr = args[0];
    const seconds = parseTime(timeStr);
    if (seconds === null) return message.reply({ embeds: [errorEmbed('Invalid time! Use `1:30` or `90`')] });
    const ok = await queue.seek(seconds);
    return message.reply({ embeds: [ok ? successEmbed(`Seeked to **${timeStr}**!`) : errorEmbed('Could not seek!')] });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════════════════════
module.exports.searchcmd = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search YouTube and pick a song')
    .addStringOption(o =>
      o.setName('query').setDescription('Search query').setRequired(true)
    ),
  name: 'search',
  aliases: ['find', 'sc'],

  async execute(interaction, client) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    try {
      const results = await search(query, 5);
      const embed = searchEmbed(results, query);
      const msg = await interaction.editReply({ embeds: [embed] });

      // Add number reactions for selection
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
      for (let i = 0; i < Math.min(results.length, 5); i++) {
        await msg.react(emojis[i]).catch(() => {});
      }
      await msg.react('❌').catch(() => {});

      const filter = (r, u) => (emojis.includes(r.emoji.name) || r.emoji.name === '❌') && u.id === interaction.user.id;
      const collected = await msg.awaitReactions({ filter, max: 1, time: 30000 });
      const reaction = collected.first();

      if (!reaction || reaction.emoji.name === '❌') {
        return msg.edit({ embeds: [infoEmbed('Search cancelled.')], components: [] });
      }

      const idx = emojis.indexOf(reaction.emoji.name);
      const chosen = results[idx];

      // Simulate a play
      const playCmd = require('./play');
      const fakeInteraction = {
        guild: interaction.guild,
        member: interaction.member,
        channel: interaction.channel,
        user: interaction.user,
        deferred: true,
        replied: false,
        isChatInputCommand: () => false,
        editReply: (p) => msg.edit(p),
        deferReply: async () => {},
      };
      await playCmd.run(fakeInteraction, [chosen.url], client);

    } catch (err) {
      return reply(interaction, { embeds: [errorEmbed(`Search failed: ${err.message}`)] });
    }
  },

  async run(message, args, client) {
    if (!args.length) return message.reply({ embeds: [errorEmbed('Provide a search query!')] });
    const query = args.join(' ');
    try {
      const results = await search(query, 5);
      const embed = searchEmbed(results, query);
      const msg = await message.reply({ embeds: [embed] });

      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
      for (let i = 0; i < Math.min(results.length, 5); i++) {
        await msg.react(emojis[i]).catch(() => {});
      }
      await msg.react('❌').catch(() => {});

      const filter = (r, u) => (emojis.includes(r.emoji.name) || r.emoji.name === '❌') && u.id === message.author.id;
      const collected = await msg.awaitReactions({ filter, max: 1, time: 30000 });
      const reaction = collected.first();

      if (!reaction || reaction.emoji.name === '❌') {
        return msg.edit({ embeds: [infoEmbed('Search cancelled.')] });
      }

      const idx = emojis.indexOf(reaction.emoji.name);
      const chosen = results[idx];
      const playCmd = require('./play');
      await playCmd.run(message, [chosen.url], client);

    } catch (err) {
      return message.reply({ embeds: [errorEmbed(`Search failed: ${err.message}`)] });
    }
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseTime(str) {
  if (!str) return null;
  if (/^\d+$/.test(str)) return parseInt(str);
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function searchEmbed(results, query) {
  const list = results.map((r, i) =>
    `**${i + 1}.** [${r.title}](${r.url}) — \`${r.duration}\``
  ).join('\n');

  return new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({ name: `🔍 Search Results for: ${query}` })
    .setDescription(list + '\n\nReact with the number to play or ❌ to cancel.')
    .setFooter({ text: 'RexoX Music 🎵 • Expires in 30s' });
}
