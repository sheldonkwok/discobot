import * as Discord from 'discord.js';

const STAT_WEIGHT_REGEX = /^!sim.*-s$/;
const RESPONSE_MESSAGE = "You should not use stat weights for most sims! " +
  "Use Top Gear or Droptimizer to determine what items you should equip. " +
  "Stat weights are highly variable and generally not indicative of what " +
  "items you should aim for.";

export async function run(msg: Discord.Message): Promise<void> {
  const { channel, content } = msg;

  if (STAT_WEIGHT_REGEX.test(content)) {
    await channel.send(RESPONSE_MESSAGE);
  }
}

