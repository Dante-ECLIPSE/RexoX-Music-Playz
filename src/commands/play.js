console.log("[PLAY] Command received");
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { MusicQueue } = require('../utils/MusicQueue');
const { resolve, search } = require('../utils/resolver');
const { errorEmbed, successEmbed, addedEmbed, nowPlayingEmbed, infoEmbed } = require('../utils/embeds');

// ── Shared Logic ──────────────────────────────────────────────────────────────
async function handlePlay(interaction, query, client) {
  const isSlash = !!interaction.isChatInputCommand;

  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return reply(interaction, { embeds: [errorEmbed('You must be in a voice channel!')] });
  }

  const perms = voiceChannel.permissionsFor(interaction.guild.members.me);
  if (!perms.has('Connect') || !perms.has('Speak')) {
    return reply(interaction, { embeds: [errorEmbed('I need **Connect** and **Speak** permissions!')] });
  }

  if (interaction.deferred === false || interaction.replied === false) {
    try {
      if (interaction.deferReply) await interaction.deferReply();
    } catch {}
  }

  let queue = client.queues.get(interaction.guild.id);
  if (!queue) {
    queue = new MusicQueue(interaction.guild, interaction.channel, voiceChannel);
    client.queues.set(interaction.guild.id, queue);
    // Patch destroy to clean up map
    const origDestroy = queue.destroy.bind(queue);
    queue.destroy = () => { origDestroy(); client.queues.delete(interaction.guild.id); };
  }

  if (!queue.connection) {
    try {
      await queue.join(voiceChannel);
    } catch (err) {
      client.queues.delete(interaction.guild.id);
      return reply(interaction, { embeds: [errorEmbed(`Failed to join voice channel: ${err.message}`)] });
    }
  }

  try {
    const result = await resolve(query);
    const requester = interaction.member?.toString() || interaction.user?.toString() || 'Unknown';

    if (result.type === 'playlist') {
      for (const song of result.songs) {
        await queue.addSong(song, requester);
      }
      const wasEmpty = queue.songs.length === result.songs.length;
      if (wasEmpty) queue.play();

      return reply(interaction, {
        embeds: [
          successEmbed(`Added **${result.songs.length}** songs from playlist **${result.name}** to the queue!`)
        ]
      });
    }

    const song = result.songs[0];
    await queue.addSong(song, requester);

    const wasEmpty = queue.songs.length === 1;
    if (wasEmpty) {
      await queue.play();
      return reply(interaction, { embeds: [nowPlayingEmbed(song, queue)] });
    }

    return reply(interaction, {
      embeds: [addedEmbed(song, queue.songs.length)]
    });

  } catch (err) {
    console.error('[Play Error]', err);
    return reply(interaction, { embeds: [errorEmbed(`Could not find or play: **${query}**\n\`${err.message}\``)] });
  }
}

function reply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload).catch(() => interaction.channel?.send(payload));
  }
  return interaction.reply(payload).catch(() => interaction.channel?.send(payload));
}

// ── Slash Command ─────────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or YouTube playlist')
    .addStringOption(o =>
      o.setName('query')
       .setDescription('Song name, YouTube URL, or playlist URL')
       .setRequired(true)
    ),

  // prefix props
  name: 'play',
  aliases: ['p', 'pl'],
  usage: '!play <song name or URL>',
  description: 'Play a song from YouTube',

  async execute(interaction, client) {
    // Slash
    const query = interaction.options.getString('query');
    await handlePlay(interaction, query, client);
  },

  async run(message, args, client) {
    // Prefix
    if (!args.length) {
      return message.reply({ embeds: [errorEmbed('Please provide a song name or URL!')] });
    }
    const query = args.join(' ');

    const fakeInteraction = {
      guild: message.guild,
      member: message.member,
      channel: message.channel,
      user: message.author,
      deferred: false,
      replied: false,
      isChatInputCommand: () => false,
      reply: (p) => message.reply(p),
      editReply: (p) => message.reply(p),
      deferReply: async () => {},
    };

    await handlePlay(fakeInteraction, query, client);
  },
};
