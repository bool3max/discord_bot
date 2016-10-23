import ChatCommand from '../ChatCommand';
import db from '../db/database';
import CurrencyUser from '../CurrencyUser';
import r_handler from '../utils/reject_handler';

export const coinflip = new ChatCommand('coinflip', function(msg, args) {
	CurrencyUser.exists(msg.author.username, {msg}).then(() => {
		let [action, arg1, arg2] = args;
		switch(action.toLowerCase()) {
			case 'list':
				return fetchActiveGames().then(activeGames => {
					if(activeGames.length === 0) {
						return msg.reply('There are no currently active games');
					}

					let gamesString = 'Currently open games:\n\n';
					activeGames.forEach((activeGame, i, arr) => {
						activeGame.side = Number(activeGame.side); //because transformer only accepts a number
						gamesString += `- **${activeGame.author}** - **$${activeGame.amount}** - **${transformer(activeGame.side)}**\n`;
					});

					gamesString += '\nYou can join any of these games by doing: **!coinflip join <username>**.'

					return msg.channel.sendMessage(gamesString);
				});
				break;
			case 'make':
				if((!arg1 || !arg2) || (typeof arg1 !== 'number' || typeof arg2 !== 'string')) {
					//if the user didn't pass enough arguments or they're not the correct type, return and reply with usage
					return Promise.reject({msg, u: this.usageString})
				}

				return db.existsAsync(`coinflip_${msg.author.username}`).then(exists => {
					if(exists) {
						return Promise.reject({msg, u: 'You already have an open game!'});
					}
					if(arg1 < 1 || (arg2.toLowerCase() !== 'heads' && arg2.toLowerCase() !== 'tails')) {
						return Promise.reject({msg, u: this.usageString})
					}
					return new CurrencyUser(msg.author.username).bal('GET', null, {msg});
				}).then(bal => {
					if(bal < arg1) {
						return Promise.reject({msg, u: `You do not have enough money. Your current balance is: **$${bal}**.`});
					}
					return db.hmsetAsync(`coinflip_${msg.author.username}`, ['author', msg.author.username, 'authorId', msg.author.id, 'amount', arg1, 'side', transformer(arg2)]);
				}).then(() => new CurrencyUser(msg.author.username).bal('DECR', arg1, {msg})).then(() => msg.reply('You sucessfully created a game!'));
				break;
			case 'join':
				if(!arg1 || typeof arg1 !== 'string') {
					return Promise.reject({msg, u: this.usageString});
				}

				let gameDbString = `coinflip_${arg1}`,
					flipValue = Math.floor(Math.random() * 2), //0 or 1
					joiner = new CurrencyUser(msg.author.username),
					author,
					gameData;

				return db.existsAsync(gameDbString).then(exists => {
					if(exists) {
						return db.hgetallAsync(gameDbString);
					} else {
						return Promise.reject({msg, u: `**${arg1}** currently isn't hosting a game.`});
					}
				}).then(data => {
					gameData = data;
					author = new CurrencyUser(data.author);
				}).then(() => joiner.bal('GET', null, {msg})).then(bal => {
					if(bal < Number(gameData.amount)) {
						return Promise.reject({msg, u: `You need **$${gameData.amount}** to join this coinflip game. Your current balance is **$${bal}**.`});
					}
				}).then(() => {
					if(flipValue === Number(gameData.side)) {
						//the author of the coinflip game won
						//steps: give author 2 * gameData.amount, remove gameData.amount from joiner's balance, delete game entry from db, reply with a message
						return Promise.all([
							author.bal('INCR', Number(gameData.amount) * 2),
							joiner.bal('DECR', Number(gameData.amount)),
							db.delAsync(gameDbString),
							msg.channel.sendMessage(`The coin landed on **${transformer(flipValue)}**! <@!${gameData.authorId}> just won against <@!${msg.author.id}> for **$${gameData.amount}**`)
						]);

					} else {
						//the joiner won
						//steps: give joiner gameData.amount, delete game entry from db, reply with a message
						return Promise.all([
							joiner.bal('INCR', Number(gameData.amount)),
							db.delAsync(gameDbString),
							msg.channel.sendMessage(`The coin landed on **${transformer(flipValue)}**! <@!${msg.author.id}> just won against <@!${gameData.authorId}> for **$${gameData.amount}**.`)
						]);
					}
				});
				break;
			default: 
				return Promise.reject({msg, u: this.usageString});
		}
	}).catch(r_handler);
}, {
	requiredParams: 1,
	aliases: ['cf', 'coinf'],
	usage: ['!coinflip list', '!coinflip make <amount> <side>', '!coinflip join <username>']
});

//!coinflip list

function fetchActiveGames() {
	//returns an array of objcets that reporesent an active game
	return db.keysAsync('coinflip_*').then(keys => {
		return Promise.all(keys.map(key => db.hgetallAsync(key)));
	});
}

function transformer(val, uppercase = true) {
	// 0 = heads, 1 = tails
	//accepts a number, or 'heads' or 'tails' (case insensitive)
	if(typeof val === 'number') {
		return val === 0 ? uppercase ? 'HEADS' : 'heads' : uppercase ? 'TAILS' : 'tails';
	}

	val = val.toLowerCase();

	if(val === 'heads') {
		return 0
	} else if(val === 'tails') {
		return 1
	} else {
		throw 'Pass in either "heads" or "tails"';
	}
}