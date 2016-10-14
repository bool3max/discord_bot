import db from '../database';
import CurrencyUser from '../CurrencyUser';
import r_handler from '../utils/reject_handler';
import fetch from 'node-fetch';

export default function extend(DiscordClient) {
	DiscordClient.defineCommand('purchaseCmd', (msg, args) => {
		console.log(args);
		
		let [commandName] = args;

		new CurrencyUser(msg.author.username).purchaseCommand(commandName.toLowerCase(), {msg}).then(() => msg.reply(`You successfully purchased the **${commandName}** command.`)).catch(r_handler);

		//pretty much every funciton that handles 'commands' automatically transforms them to lower case, but just in case, we also transform it before we pass it to any of these function
	}, {
		requiredParams: 1,
		usage: '!purchaseCmd <commandName>'
	});

	DiscordClient.defineCommand('myCmds', msg => {
		new CurrencyUser(msg.author.username).getOwnedCommands({msg}).then(cmdsArray => {
			if(!cmdsArray.length) {
				return msg.reply('You haven\'t purchased any commands.').catch(r_handler);
			}
			console.log('lll');
			msg.reply(`You currently own: ${cmdsArray.join(', ')}`).catch(r_handler);
		})
	});

	DiscordClient.defineCommand('test', (msg, args) => {
		console.log('Test executed');
		console.log(args);
	}, {
		requiredParams: 1
	})
}