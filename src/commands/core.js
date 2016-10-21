import ChatCommand from '../ChatCommand';
import db from '../db/database';
import CurrencyUser from '../CurrencyUser';
import r_handler from '../utils/reject_handler';

export const purchaseCmd = new ChatCommand('purchaseCmd', (msg, args) => {
	let [commandName] = args;
	new CurrencyUser(msg.author.username).purchaseCommand(commandName.toLowerCase(), {msg}).then(() => msg.reply(`You successfully purchased the **${commandName}** command.`)).catch(r_handler);
	//pretty much every funciton that handles 'commands' automatically transforms them to lower case, but just in case, we also transform it before we pass it to any of these function
}, {
	requiredParams: 1,
	usage: '!purchaseCmd <commandName>'
});

export const myCmds = new ChatCommand('myCmds', msg => {
	new CurrencyUser(msg.author.username).getOwnedCommands({msg}).then(cmdsArray => {
		if(!cmdsArray.length) {
			return msg.reply('You haven\'t purchased any commands.').catch(r_handler);
		}
		msg.reply(`You currently own: ${cmdsArray.join(', ')}`).catch(r_handler);
	})
});

export const bug = new ChatCommand('bug', (msg, args) => {
	let [report] = args;
	if(report !== '') {
		db.saddAsync('bugs', report).then(() => msg.reply('You successfully report a bug!')).catch(r_handler);
	}
}, {
	requiredParams: 1,
	usage: '!bug <description>'
});

export const test = new ChatCommand('test', (msg, args) => {
	if(typeof args[0] === 'number') {
		msg.reply('success').catch(r_handler);
	}
}, {exec_cost: 30, requiredParams: 1});