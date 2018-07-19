import * as Discord from 'discord.js';
const config = require('../config.json');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready');
});

client.login(config.discord.token);
