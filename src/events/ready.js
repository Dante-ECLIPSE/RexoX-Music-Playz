const { REST, Routes, ActivityType } = require('discord.js');
const chalk = require('chalk');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    console.log(chalk.bold.green(`\n✅ Logged in as ${client.user.tag}`));

    // Set bot presence
    client.user.setPresence({
      activities: [{
        name: '🎵 Music | /help or !help',
        type: ActivityType.Listening,
      }],
      status: 'online',
    });

    // Register slash commands globally
    const commands = [];
    const cmdModules = [
      require('../commands/play'),
      ...Object.values(require('../commands/controls')),
      ...Object.values(require('../commands/queue')),
      ...Object.values(require('../commands/extras')),
      require('../commands/help'),
    ];

    for (const cmd of cmdModules) {
      if (cmd.data) {
        commands.push(cmd.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log(chalk.yellow(`\n[/] Registering ${commands.length} slash commands...`));
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log(chalk.green(`[/] Slash commands registered globally ✅\n`));
    } catch (err) {
      console.error(chalk.red('[/] Failed to register slash commands:'), err);
    }
  },
};
