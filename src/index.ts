import * as Discord from 'discord.js';

import * as tts from './tts';

const config = require('../config.json');
const client = new Discord.Client();

const VOICE_CHANNEL_ID: string = config.discord.voiceChannelID;

function exit() {
  console.warn('Unintentional exit');
  console.warn(arguments);
  process.exit(1);
}

function matchVoiceChannel(c: Discord.Channel): boolean {
  return c.type === 'voice' && c.id === VOICE_CHANNEL_ID;
}

client.on('ready', async () => {
  const channel = client.channels.find(matchVoiceChannel) as Discord.VoiceChannel;
  if (!channel) throw new Error('Unable to join voice channel');

  const voiceConn = await channel.join();

  client.on('voiceStateUpdate', async (_, member) => {
    if (member.voiceChannelID === null) return;

    const username = member.nickname || member.user.username;
    const file = await tts.get(username);
    const dispatcher = voiceConn.playFile(file);
    dispatcher.on('end', () => dispatcher.end());
  });

  console.log('ready');
});

client.on('error', exit);
client.login(config.discord.token);

process.on('SIGINT', () => {
  client.destroy();
});
