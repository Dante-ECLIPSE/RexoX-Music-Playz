require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// ─── Client Setup ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.queues = new Map(); // guildId -> MusicQueue

// ─── Load Commands ─────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    client.slashCommands.set(command.data.name, command);
    console.log(chalk.cyan(`[CMD] Loaded slash: /${command.data.name}`));
  }
  if (command.name) {
    client.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => client.commands.set(alias, command));
    }
    console.log(chalk.green(`[CMD] Loaded prefix: !${command.name}`));
  }
}

// ─── Load Events ──────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(chalk.yellow(`[EVT] Loaded event: ${event.name}`));
}

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log(chalk.bold.magenta('\n🎵 RexoX Music Bot is Online!\n'));
});
