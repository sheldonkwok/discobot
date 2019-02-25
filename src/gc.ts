import pMap from 'p-map';
import * as Discord from 'discord.js';

const DELETE_TYPE = 'GUILD_MEMBER_JOIN';

export async function run(msg: Discord.Message): Promise<void> {
  const { guild, channel } = msg;
  const members = guild.members.array();

  const membersToDelete = new Set<string>();

  await pMap(members, async mem => {
    if (mem.roles.size > 1) return;

    membersToDelete.add(mem.id);
    await mem.kick();
  });

  const currMsgs = await channel.fetchMessages();
  const msgsToDelete = currMsgs
    .filter(m => m.type === DELETE_TYPE && membersToDelete.has(m.author.id))
    .array();

  const finalMsgsToDelete = msgsToDelete.concat(msg);
  await msg.channel.bulkDelete(finalMsgsToDelete);
}
