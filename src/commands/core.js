import db from '../database.js';
import CurrencyUser from '../CurrencyUser';
import r_handler from '../utils/reject_handler';
import fetch from 'node-fetch';

export default function extend(DiscordClient) {
	DiscordClient.defineCommand('purchaseCmd', (msg, args) => {
		let [commandName] = args;
		commandName = commandName.toLowerCase();

		let currentUser,
			commandPrice;

		CurrencyUser.exists(msg.author.username, msg).then(exists => {
			if(!exists) {
				return Promise.reject('user doesn\'t exist in db ');
			}
		}).then(() => {
			return db.hexistsAsync('commandPrices', commandName);
		}).then(exists => {
			if (!exists) {
				msg.reply('That command doesn\'t exist, or is not purchasable.').catch(console.error);
				return Promise.reject('command doesn\'t exist or is not purchasable');
			} else {
				return db.hgetAsync('commandPrices', commandName);
			}
		}).then(price => {
			commandPrice = price;
			currentUser = new CurrencyUser(msg.author.username);
			return currentUser.getOwnedCommands();
		}).then(ownedCmds => {
			if (!ownedCmds.includes(commandName)) {
				//the command exists, but the user doesn't own it
				return currentUser.bal('GET');
			} else {
				msg.reply('You\'ve already purchased that command!').catch(console.error);
				return Promise.reject('user already owns command');
			}
		}).then(bal => {
			if (bal >= commandPrice) {
				//proceed to buy the command
				return currentUser.purchaseCommand(commandName);
			} else {
				msg.reply(`You do not have enough money. The command costs **$${commandPrice}**, and your current balance is **$${bal}**.`);
				return Promise.reject('user not enough money');
			}
		}).then(() => {
			msg.reply(`You successfully pruchased the **${commandName}** command.`);
		}).catch(console.error);


	}, {
		requiredParams: 1,
		usage: '!purchaseCommand <commandName>'
	});
}