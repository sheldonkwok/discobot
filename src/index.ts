import * as Discord from 'discord.js';

import * as gc from './gc';
import * as tts from './tts';

const config = require('../config.json');
const client = new Discord.Client();

const VOICE_CHANNEL_ID: string = config.discord.voiceChannelID;
const VOICE_RECONNECT_DELAY = 2 * 60 * 60 * 1000;

function exit(err: Error) {
  console.warn('Unintentional exit');
  console.error(err);

  process.exit(1);
}

function matchVoiceChannel(c: Discord.Channel): boolean {
  return c.type === 'voice' && c.id === VOICE_CHANNEL_ID;
}

async function handleVoiceState(
  voiceConn: Discord.VoiceConnection,
  oldMember: Discord.GuildMember,
  newMember: Discord.GuildMember,
): Promise<void> {
  if (oldMember.voiceChannelID !== null || newMember.voiceChannelID === null) return;

  const username = newMember.nickname || newMember.user.username;
  const file = await tts.get(newMember.id, username);

  const dispatcher = voiceConn.playFile(file);
  dispatcher.on('end', () => dispatcher.end());
}

client.on('ready', async () => {
  const channel = client.channels.find(matchVoiceChannel) as Discord.VoiceChannel;
  if (!channel) throw new Error('Unable to join voice channel');

  let voiceConn = await channel.join();

  client.on('message', async msg => {
    const { content } = msg;

    if (content === '!gc') await gc.run(msg);
  });

  client.on('voiceStateUpdate', async (oldMember, newMember) => {
    await handleVoiceState(voiceConn, oldMember, newMember);
  });

  setInterval(async () => {
    voiceConn.disconnect();
    voiceConn = await channel.join();
  }, VOICE_RECONNECT_DELAY);

  console.log('ready');
});

client.on('error', exit);

client.login(config.discord.token);

process.on('unhandledRejection', exit);

process.on('SIGINT', () => {
  client.destroy();
  process.exit(2);
});
