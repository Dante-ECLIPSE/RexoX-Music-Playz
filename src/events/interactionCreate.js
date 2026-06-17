const { errorEmbed } = require('../utils/embeds');

// All slash commands registered as single-export modules or multi-export
function loadAllSlash(client) {
  if (client._slashLoaded) return;
  client._slashLoaded = true;

  const modules = [
    require('../commands/play'),
    ...Object.values(require('../commands/controls')),
    ...Object.values(require('../commands/queue')),
    ...Object.values(require('../commands/extras')),
    require('../commands/help'),
  ];

  for (const cmd of modules) {
    if (cmd.data) {
      client.slashCommands.set(cmd.data.name, cmd);
    }
  }
}

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    loadAllSlash(client);

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[Slash Error] /${interaction.commandName}:`, err);
      const payload = { embeds: [errorEmbed(`An error occurred: \`${err.message}\``)], ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
