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
		chatCommands.forEach(chatCommand => chatCommand.process(msg));
	});

	CurrencyUser.initPaycheck(this);
	liveLeaderboard_init(this);
});

Bot.login(bot_config.bot_token);

function loadCommands() {
	//TODO: add validation to check whether cmdsObj's prop is an instance of ChatCommand
	//loops through all files in build/commands. requires() each one. if loops through each one's props. if it's an own prop, pushes it's value to the chatCommands arr
	//if at the end, chatCommands has no elements, returns null, otherwise returns the chatCommands array
	let chatCommands = new Array();
	fs.readdirSync('./build/commands').forEach(cmdFile => {
		const cmdsObj = require(`./commands/${cmdFile}`);
		for(let prop in cmdsObj) {
			if(cmdsObj.hasOwnProperty(prop)) {
				chatCommands.push(cmdsObj[prop]);
			}
		}
	});

	return chatCommands.length < 1 ? null : chatCommands;
}