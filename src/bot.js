import Discord from 'discord.js';
import extend from './discord_extender'; //extends the base client with a few methods, must run the extender before making any Client instances
import * as Currency from './Currency'; //the Currency.js module
global.XMLHttpRequest = require('xhr2');

extend(Discord.Client); //running the extender on the client

const botToken = 'MjIyODA3NDk2MTk5MzcyODAx.CrV4zg.VyOFUWEgMzs1nhGkCBkH4EV00SE';
const Bot = new Discord.Client();

Bot.on('ready', function() {
	console.log('0lifeBot ready.');
	Currency.init(this); //we init the Currency script

	this.defineAction('spam', (msg, args) => {

		let messageToSend = args[0],
			intervalInMsec = parseInt(args[1]) * 1000,
			cancelAfter = parseInt(args[2]) * 1000;

		let interval = setInterval( () => {
			msg.channel.sendMessage(messageToSend);
		}, intervalInMsec);

		if(cancelAfter > 0) setTimeout( () => clearInterval(interval), cancelAfter);

	}, {requiredParams: 3, usage: '!spam <message> <interval> <timeout>'});

});

Bot.login(botToken);