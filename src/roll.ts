import * as Discord from 'discord.js';

const ROLL_MAX_REGEX = /!roll\s+(?<max>-?\d+)/;
const DEFAULT_MAX = 100;

export async function run(msg: Discord.Message): Promise<void> {
  const { channel, content, author } = msg;

  const match = content.match(ROLL_MAX_REGEX)?.groups?.max;
  const rollMax = match && parseInt(match, 10) > 0 ? parseInt(match, 10) : DEFAULT_MAX;
  const result = Math.floor(Math.random() * rollMax) + 1;
  await channel.send(`${author.username} rolls ${result} (1-${rollMax})`);
}
