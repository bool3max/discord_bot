const bot_config = require('./bot_config.json');

import fs from 'fs';
import Discord from 'discord.js';
import extend from './discord_extender'; //extends the base client with a few methods, must run the extender before making any Client instances

import liveLeaderboard_extend from './live_leaderboard';

extend(Discord.Client); //running the extender on the client

const Bot = new Discord.Client();

Bot.setMaxListeners(50); //temp, until i restructure the command definining to use only 1 listener

Bot.on('ready', function() {
	console.log('0lifeBot ready, loading commands...');
	loadCommands(this);
	liveLeaderboard_extend(this);

});

Bot.login(bot_config.bot_token);

function loadCommands(DiscordClient) {
	//each file in ./build/commands must have a 'default' export, that is a function that takes an instance of a discord client, only then is this function going to work
	fs.readdirSync('./build/commands').forEach((cmdFile, i, arr) => {
		require(`./commands/${cmdFile}`).default(DiscordClient);
		console.log(`Succesfully loaded the ${cmdFile} command file.`);
		if(i === arr.length - 1) {
			console.log("\x1b[36mSuccesfully loaded all command files!\x1b[0m\n ");
		}
	});
}