import db from '../database.js';
import CurrencyUser from '../CurrencyUser';
import fetch from 'node-fetch';

export default function extend(DiscordClient) {

	DiscordClient.on('message', msg => {
			//transform subreddits into actual links
			const {content, author} = msg;

			if(author !== DiscordClient.user) {
				let regex = /(r\/|\/r\/)\w+/g;

				let match = content.match(regex);

				if(match) {
					match.forEach(str => {
						let subName = str.substring(str.startsWith('/') ? 3 : 2),
							aboutUrl = `https://www.reddit.com/r/${subName}/about.json`;

						fetch(aboutUrl).then(res => {
							console.log('Stats: ', res.status, res.ok, res.url);
							if((res.ok || res.status === 403) && res.url === aboutUrl)  {
								//request was successfull and the subreddit exists
								//403 is returned if a subreddit is forbidden
								return msg.reply(`You linked a subreddit: https://reddit.com/r/${subName} .`);

							} else {
								//network error or sub doesn't exist
								return msg.reply(`Subreddit: ${subName} doesn't exist.`);
							}
						}).catch(console.error);
					});
				}
			}

	});

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