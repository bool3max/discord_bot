'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = extend;

var _CurrencyUser = require('../CurrencyUser');

var _CurrencyUser2 = _interopRequireDefault(_CurrencyUser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance

	_CurrencyUser2.default.initPaycheck(DiscordClient);

	DiscordClient.defineCommand('makeBankAcc', msg => {
		_CurrencyUser2.default.exists(msg.author.username).then(exists => {
			if (!exists) {
				msg.reply(`Your new bank account has been credited with **$${ _CurrencyUser2.default.defaults.startingBal }.** You can check your balance by running **!bal**.`).catch(console.log);
				return _CurrencyUser2.default.create(msg.author.username);
			} else return msg.reply('You already have a bank account.');
		}).catch(console.log);
	});

	DiscordClient.defineCommand('bal', msg => {
		_CurrencyUser2.default.exists(msg.author.username, msg).then(exists => {
			if (exists) {
				let currentUser = new _CurrencyUser2.default(msg.author.username);
				return currentUser.bal('GET');
			} else return Promise.reject(`User ${ msg.author.username } doesn't exist`);
		}).then(bal => msg.reply(`Your current balance is **$${ bal }**.`)).catch(console.log);
	});

	DiscordClient.defineCommand('pay', (msg, args) => {
		_CurrencyUser2.default.exists(msg.author.username, msg).then(exists => {
			if (exists) {
				let [receiver, amount] = args;

				return new _CurrencyUser2.default(msg.author.username).transferBalance(receiver, amount).then(() => msg.reply(`You successfully transfered **$${ amount }** to **${ receiver }**.`));
			} else return Promise.reject();
		}).catch(err => {
			if (err) {
				console.error(err);
				msg.reply(err).catch(console.error);
			}
		});
	}, {
		usage: '!pay <user> <amount>',
		requiredParams: 2
	});

	//games

	DiscordClient.defineCommand('coinflip', (msg, args) => {
		// 0 = heads , 1 = tails
		const transformer = num => num === 0 ? 'heads' : 'tails';

		let wager = args[0],
		    userSide = args[1].toLowerCase() === 'heads' ? 0 : 1,
		    pcSide = Math.floor(Math.random() * 2);

		_CurrencyUser2.default.exists(msg.author.username, msg).then(exists => {
			if (exists) {
				let currentUser = new _CurrencyUser2.default(msg.author.username);
				return currentUser.bal('GET');
			} else return Promise.reject(`User ${ msg.author.username } doesn't have a bank account.`);
		}).then(bal => {

			let currentUser = new _CurrencyUser2.default(msg.author.username);

			if (wager <= bal) {
				if (userSide === pcSide) {
					//the user won
					msg.reply(`You won **$${ wager }**! The coin landed on **${ transformer(pcSide) }**!`).catch(console.log);
					return currentUser.bal('INCR', wager);
				} else {
					//he didn't
					msg.reply(`You lost **$${ wager }**. The coin landed on **${ transformer(pcSide) }**!`).catch(console.log);
					return currentUser.bal('DECR', wager);
				}
			} else return msg.reply(`You do not have enough money. Your current balance is **$${ bal }**.`);
		}).catch(console.log);
	}, {
		usage: '!coinflip <wager> <side>',
		requiredParams: 2
	});

	//utils

	DiscordClient.defineCommand('leaderboard', msg => {
		_CurrencyUser2.default.constructLeaderboard().then(leaderboard => {
			let textLeaderboard = ``;
			let i = 1;
			leaderboard.forEach((user, index) => {
				if (index === 0) {
					textLeaderboard += `**${ i }.** :first_place: ${ user.username } - **$${ user.bal }**\n\n`;
				} else if (index === 1) {
					textLeaderboard += `**${ i }.** :second_place: ${ user.username } - **$${ user.bal }**\n\n`;
				} else if (index === 2) {
					textLeaderboard += `**${ i }.** :third_place: ${ user.username } - **$${ user.bal }**\n\n`;
				} else textLeaderboard += `**${ i }.** ${ user.username } - **$${ user.bal }**\n\n`;

				i++;
			});
			return msg.channel.sendMessage(textLeaderboard);
		}).catch(console.error);
	});
}