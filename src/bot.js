import Discord from 'discord.js';
import extend from './discord_extender'; //extends the base client with a few methods, must run the extender before making any Client instances

//importing commands
import extend_currency from './commands/currency';
import extend_misc from './commands/misc';
//
extend(Discord.Client); //running the extender on the client

const botToken = 'MjIyODA3NDk2MTk5MzcyODAx.CtJ-cA.f_b2_bUi8R-hQuHiQkJlmmyr1LE';
const Bot = new Discord.Client();

Bot.on('ready', function() {
	console.log('0lifeBot ready.');
	
	extend_currency(this);
	extend_misc(this);

});

Bot.login(botToken);