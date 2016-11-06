const bot_config = require('./bot_config.json');

import fs from 'fs';
import Discord from 'discord.js';

import liveLeaderboard_init from './live_leaderboard';
import CurrencyUser from './CurrencyUser';

const Bot = new Discord.Client();

Bot.on('ready', function() {
	console.log('0lifeBot ready, loading commands...');

	const chatCommands = loadCommands();
	console.log(`\x1b[36mSuccesfully loaded ${chatCommands.length} ChatCommand instances\x1b[0m\n `);


	this.on('message', msg => {
		chatCommands.forEach(chatCommand => {
			if(chatCommand instanceof require('./ChatCommand').default) {
				chatCommand.process(msg);
			}
		});
	});

	CurrencyUser.initPaycheck(this);
	liveLeaderboard_init(this);
});

Bot.login(bot_config.bot_token);

function loadCommands() {
	let chatCommands = new Array();
	fs.readdirSync('./build/commands').forEach(cmdFile => {
		chatCommands.push(...require(`./commands/${cmdFile}`).default);
	});
	return chatCommands;
}