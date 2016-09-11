import Discord from 'discord.js';
import ajax from './ajax_lib';
import extend from './discord_extender';
global.XMLHttpRequest = require('xhr2');

const botToken = 'MjIyODA3NDk2MTk5MzcyODAx.CrV4zg.VyOFUWEgMzs1nhGkCBkH4EV00SE';
extend(Discord.Client);

const Bot = new Discord.Client();


Bot.on('ready', function() {
	this.instantDelete('XWhatevs');
});

Bot.login(botToken);
