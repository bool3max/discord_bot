import fs from 'fs';
import Discord from 'discord.js';
import extend from './discord_extender'; //extends the base client with a few methods, must run the extender before making any Client instances

import liveLeaderboard_extend from './live_leaderboard';

extend(Discord.Client); //running the extender on the client

const botToken = 'MjIyODA3NDk2MTk5MzcyODAx.CtJ-cA.f_b2_bUi8R-hQuHiQkJlmmyr1LE';
const Bot = new Discord.Client();

Bot.on('ready', function() {
	console.log('0lifeBot ready, loading commands...');
	loadCommands(this);
	
	liveLeaderboard_extend(this);

});

Bot.login(botToken);

function loadCommands(DiscordClient) {
	//each file in ./build/commands must have a 'default' export, that is a function that takes an instance of a discord client, only then is this function going to work
	fs.readdirSync('./build/commands').forEach((cmdFile, i, arr) => {
		require(`./commands/${cmdFile}`).default(DiscordClient);
		console.log(`Succesfully loaded the ${cmdFile} command file.`);
		if(i === arr.length - 1) {
			console.log('Succesfully loaded all command files!\n');
		}
	});
}