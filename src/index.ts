import * as Discord from 'discord.js';
import * as bluebird from 'bluebird';

import * as tts from './tts';
import * as sim from './sim';
import * as roll from './roll';

const config = require('../config.json');
const client = new Discord.Client();

const VOICE_CHANNEL_ID: string = config.discord.voiceChannelID;
const VOICE_RECONNECT_DELAY = 12 * 60 * 60 * 1000;
const PLAY_DELAY = 500; // Don't want to play without the person being connected!

let voiceConn: Discord.VoiceConnection;

function isVoiceChannel(channel: Discord.Channel): channel is Discord.VoiceChannel {
  return channel.type === 'voice';
}

async function handleVoiceState(oldState: Discord.VoiceState, newState: Discord.VoiceState): Promise<void> {
  const joined = oldState.channelID === null && typeof newState.channelID === 'string';
  if (!joined || newState.member === null) return;

  const member = newState.member;
  const username = member.nickname || member.user.username;

  const [file] = await Promise.all([tts.get(member.id, username), bluebird.delay(PLAY_DELAY)]);

  voiceConn.play(file);
}

client.on('ready', async () => {
  const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
  if (!channel || !isVoiceChannel(channel)) throw new Error('Unable to join voice channel');

  voiceConn = await channel.join();

  client.on('message', async msg => {
    const { content } = msg;

    if (content.startsWith('!sim')) await sim.run(msg);
    if (content.startsWith('!roll')) await roll.run(msg);
  });

  client.on('voiceStateUpdate', handleVoiceState);

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
