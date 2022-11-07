import * as Discord from 'discord.js';
import * as voice from '@discordjs/voice';
import * as timers from 'timers/promises';

import * as tts from './tts.js';
import * as sim from './sim.js';
import * as roll from './roll.js';

import config from '../config.json';

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

const VOICE_RECONNECT_DELAY = 12 * 60 * 60 * 1000;
const PLAY_DELAY = 500; // Don't want to play without the person being connected!

const player = voice.createAudioPlayer();
let voiceConn: voice.VoiceConnection;

function getFirstVoiceChannel(): Discord.VoiceBasedChannel {
  for (const channel of client.channels.cache.values()) {
    if (channel.type !== Discord.ChannelType.GuildVoice) continue;
    return channel;
  }

  throw new Error('No voice channels found');
}

function joinVoice(channel: Discord.VoiceBasedChannel) {
  const channelOpts = {
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  };

  voiceConn = voice.joinVoiceChannel(channelOpts);
  voiceConn.subscribe(player);

  setInterval(async () => {
    voiceConn.disconnect();

    voiceConn = voice.joinVoiceChannel(channelOpts);
    voiceConn.subscribe(player);
  }, VOICE_RECONNECT_DELAY);
}

async function handleVoiceState(oldState: Discord.VoiceState, newState: Discord.VoiceState): Promise<void> {
  if (newState.member?.user.bot) return;

  const joined = oldState.channelId === null && typeof newState.channelId === 'string';
  if (!joined || newState.member === null) return;

  const member = newState.member;
  const username = member.nickname || member.user.username;

  const [file] = await Promise.all([tts.get(member.id, username), timers.setTimeout(PLAY_DELAY)]);

  const resource = voice.createAudioResource(file, { inputType: voice.StreamType.Arbitrary });
  player.play(resource);
  await voice.entersState(player, voice.AudioPlayerStatus.Playing, 10000);
}

client.on('ready', async () => {
  const channel = getFirstVoiceChannel();
  joinVoice(channel);

  client.on('message', async (msg) => {
    const { content } = msg;

    if (content.startsWith('!sim')) await sim.run(msg);
    if (content.startsWith('!roll')) await roll.run(msg);
  });

  client.on('voiceStateUpdate', handleVoiceState);

  console.log('ready');
});

client.login(config.discord.token);

function errored() {
  console.warn('Unintentional exit');
  console.warn(arguments);
  process.exit(1);
}

client.on('error', errored);

function exit() {
  if (voiceConn) voiceConn.disconnect();
  client.destroy();

  process.exit(2);
}

process.on('SIGINT', () => exit());
process.on('SIGTERM', () => exit());
