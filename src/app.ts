import * as Discord from 'discord.js';

import * as announcer from './announcer';
import * as sim from './sim';
import * as roll from './roll';

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on('ready', async () => {
  announcer.setup(client);

  client.on('message', async (msg) => {
    const { content } = msg;

    if (content.startsWith('!sim')) await sim.run(msg);
    if (content.startsWith('!roll')) await roll.run(msg);
  });

  console.log('ready');
});

client.on('error', (err) => {
  console.warn('Unintentional exit');
  console.warn(err);
  process.exit(1);
});

const token = process.env.DISCOBOT_TOKEN;
if (!token) throw new Error('Specify DISOBOT_TOKEN env var');
client.login(token);

function exit() {
  announcer.voiceConn?.disconnect();
  client.destroy();

  process.exit(2);
}

process.on('SIGINT', () => exit());
process.on('SIGTERM', () => exit());
