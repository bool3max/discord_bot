import db from '../database.js';
import CurrencyUser from '../CurrencyUser';

export default function extend(DiscordClient) {
	DiscordClient.defineCommand('purchaseCommand', (msg, args) => {
		let [commandName] = args;
		commandName = commandName.toLowerCase();

		let currentUser;

		db.hexistsAsync('commandPrices', commandName).then(exists => {
			if(!exists) {
				msg.reply('That command doesn\'t exist, or is not purchasable.').catch(console.error);
				return Promise.reject('command doesn\'t exist or is not purchasable');
			}
		}).then(() => {
			currentUser = new CurrencyUser(msg.author.username);
			return currentUser.getOwnedCommands();
		}).then(ownedCmds => {
			if(!ownedCmds.includes(commandName)) {

			} else {
				msg.reply('You\'ve already purchased that command!').catch(console.error);
				return Promise.reject('user already owns command');
			}
		}).catch(console.error);	

	}, {
		requiredParams: 1,
		usage: '!purchaseCommand <commandName>'
	});
}