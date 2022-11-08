import * as Discord from 'discord.js';
import * as voice from '@discordjs/voice';
import * as timers from 'timers/promises';

import * as tts from './tts';

const VOICE_RECONNECT_DELAY = 12 * 60 * 60 * 1000;
const PLAY_DELAY = 500; // Don't want to play without the person being connected!

const player = voice.createAudioPlayer();
export let voiceConn: voice.VoiceConnection | undefined;

export function setup(client: Discord.Client): void {
  const channel = getFirstVoiceChannel(client);
  joinVoice(channel);

  client.on('voiceStateUpdate', handleVoiceState);
}

function getFirstVoiceChannel(client: Discord.Client): Discord.VoiceBasedChannel {
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
    voiceConn?.disconnect();

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
