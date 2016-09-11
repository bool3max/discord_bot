import Discord from 'discord.js';
import ajax from './ajax_lib';
import extend from './discord_extender';
global.XMLHttpRequest = require('xhr2');

const botToken = 'MjIyODA3NDk2MTk5MzcyODAx.CrV4zg.VyOFUWEgMzs1nhGkCBkH4EV00SE';
extend(Discord.Client);

const Bot = new Discord.Client();


Bot.on('ready', function() {
	this.defineAction('diceroll', msg => {
		let roll = Math.floor(Math.random() * 101);
		msg.reply(`You rolled ${roll} !`);
	});

	this.defineAction('spam', (args, msg) => {

		let messageToSend = args[0],
			intervalInMsec = parseInt(args[1]) * 1000,
			cancelAfter = parseInt(args[2]) * 1000;

		let interval = setInterval( () => {
			msg.channel.sendMessage(messageToSend);
		}, intervalInMsec);

		if(cancelAfter > 0) setTimeout( () => clearInterval(interval), cancelAfter);

	}, {
		type: '/',
		static: false,
		nameSensitive: false,
	});

	this.defineAction('spamlit', (args, msg) => {
		
	}, {
		type: '/',
		static: false,
		nameSensitive: false
	});

});

Bot.login(botToken);
