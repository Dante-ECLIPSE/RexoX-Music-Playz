const { errorEmbed } = require('../utils/embeds');

const PREFIX = '!';

// Flat list of all prefix commands
function loadAllPrefix(client) {
  if (client._prefixLoaded) return;
  client._prefixLoaded = true;

  const modules = [
    require('../commands/play'),
    ...Object.values(require('../commands/controls')),
    ...Object.values(require('../commands/queue')),
    ...Object.values(require('../commands/extras')),
    require('../commands/help'),
  ];

  for (const cmd of modules) {
    if (cmd.name) {
      client.commands.set(cmd.name, cmd);
      if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
    }
  }
}

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    if (!message.guild) return;

    loadAllPrefix(client);

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.run(message, args, client);
    } catch (err) {
      console.error(`[Prefix Error] !${commandName}:`, err);
      message.reply({ embeds: [errorEmbed(`Error: \`${err.message}\``)] }).catch(() => {});
    }
  },
};
