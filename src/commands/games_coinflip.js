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
				}).then(() => {
					if(arg1 < 1 || (arg2.toLowerCase() !== 'heads' && arg2.toLowerCase() !== 'tails')) {
						return Promise.reject({msg, u: this.usageString})
					}
				});
				break;
			case 'join':
				break;
			default: 
				return Promise.reject({msg, u: this.usageString});
		}
	}).catch(r_handler);
}, {
	requiredParams: 1,
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