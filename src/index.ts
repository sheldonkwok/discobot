import * as Discord from 'discord.js';

import * as gc from './gc';
import * as tts from './tts';

const config = require('../config.json');
const client = new Discord.Client();

const VOICE_CHANNEL_ID: string = config.discord.voiceChannelID;
const VOICE_RECONNECT_DELAY = 12 * 60 * 60 * 1000;

function matchVoiceChannel(c: Discord.Channel): boolean {
  return c.type === 'voice' && c.id === VOICE_CHANNEL_ID;
}

async function handleVoiceState(
  voiceConn: Discord.VoiceConnection,
  oldMember: Discord.GuildMember,
  newMember: Discord.GuildMember,
): Promise<void> {
  const oldVoiceID = oldMember.voiceChannelID;
  if (oldVoiceID || newMember.voiceChannelID === null) return;

  const username = newMember.nickname || newMember.user.username;
  const file = await tts.get(newMember.id, username);

  voiceConn.playConvertedStream(file);
}

let voiceConn: Discord.VoiceConnection;
client.on('ready', async () => {
  const channel = client.channels.find(matchVoiceChannel) as Discord.VoiceChannel;
  if (!channel) throw new Error('Unable to join voice channel');

  voiceConn = await channel.join();

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

function errored() {
  console.warn('Unintentional exit');
  console.warn(arguments);
  process.exit(1);
}

client.on('error', errored);

client.login(config.discord.token);

function exit() {
  if (voiceConn) voiceConn.disconnect();
  client.destroy();

  process.exit(2);
}

process.on('SIGINT', () => exit());
process.on('SIGTERM', () => exit());
