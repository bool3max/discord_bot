import redis from 'redis';
import {promisifyAll} from 'bluebird';
import timeConvert from './utils/time_converter';

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const db = redis.createClient({
	password: 'a45hgf678nopzx48712yy3cc0',
	string_numbers: false
}); //we create a redis db instance on localhost:6379
db.on('error', console.log);

export class CurrencyUser {
	//a class that represents a currencyUser in the batabase
	//NOTE: do not create instances of this class with an username that doesn't exist. instead use CurrencyUser.create() (static method)
	constructor(username) {
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	bal(action, amount) {
		//utility function for modifying the balance
		//returns a promise that resolves (with a value returned from redis) when the action is completed
		//it is recommended that you pass a number to AMOUNT (it's automatically converted to a string before saving it to discord)
		switch(action) {
			case 'INCR': 
				return db.hincrbyAsync(`currencyUser:${this.username}`, ['bal', amount]);
				break;
			case 'DECR':
				return db.hincrbyAsync(`currencyUser:${this.username}`, ['bal', -amount]);
				break;
			case 'SET':
				return db.hsetAsync(`currencyUser:${this.username}`, ['bal', amount]);
				break;
			case 'GET':
				return db.hgetAsync(`currencyUser:${this.username}`, ['bal']).then(bal => parseInt(bal));
				//NOTE: returns a number
				break;
			default:
				return Promise.reject(`UNSUPPORTED ACTION TYPE: ${action}`);
		}
	}

	get() {
		//returns a promise that resolves with the user object in the database
		return CurrencyUser.getUser(this.username);
	}

	transferBalance(receiver, amountToTransfer) {
		return this.bal('GET').then(balance => {
			console.log(balance, amountToTransfer);
			if(amountToTransfer <= balance) {
				return CurrencyUser.exists(receiver);
			} else return Promise.reject(`You do not have enough money. Your current balance is **$${balance}**.`);
		}).then(exists => {
			if(exists) {
				return new CurrencyUser(receiver).bal('INCR', amountToTransfer);
			} else return Promise.reject(`**${receiver}** doesn't have a bank account.`);
		}).then(() => this.bal('DECR', amountToTransfer));
		
	}

	static create(username, bal = CurrencyUser.defaults.startingBal) {
		//returns a promise that resolves if the user was successfully created
		//make sure to never call this if the user already exists in the database, and perform some kind of check when the user tries to create a bank account
		return db.hmsetAsync(`currencyUser:${username}`, ['username', username, 'bal', bal]);
	}

	static getUser(username) {
		return CurrencyUser.exists(username).then(exists => {
			if(exists) {
				return db.hgetallAsync(`currencyUser:${username}`);
			} else return Promise.reject(`User: ${username} doesn't have a bank account.`);
		});
	}

	static getAll() {
		//returns a promise that resolves with an arr of all users in db
		return db.keysAsync('currencyUser:*').then(keys => {
			if(!keys.length) {
				return Promise.reject('No users in database.');
			}
			return Promise.all(keys.map( (username, i) => CurrencyUser.getUser( CurrencyUser.extractUsername(username) ) ));
		});
	}

	static exists(username, msg) {
		//returns a promise that resolves with a bool
		return db.existsAsync(`currencyUser:${username}`).then(exists => {
			if(!exists && msg) msg.reply(CurrencyUser.defaults.msgs.noBankAcc).catch(console.log);
			return Promise.resolve(exists);
		});
	}

	static constructLeaderboard() {
		return CurrencyUser.getAll().then(users => {

			const sortedUsers = users.sort((a, b) => {
				a.bal = parseInt(a.bal); b.bal = parseInt(b.bal);
				if(a.bal > b.bal) return -1;
				if(a.bal < b.bal) return 1;
				return 0;
			});

			return Promise.resolve(sortedUsers);

		});
	}

	static initPaycheck(DiscordClient) {
		setInterval(() => {
			console.log('Paycheck cycle.');
			CurrencyUser.getAll().then(users => {
				return Promise.all(users.map( (user, i) => new CurrencyUser(user.username).bal('INCR', CurrencyUser.defaults.paycheck.amount) ));
			}).then(() => {
				const guilds = DiscordClient.guilds.array();
				guilds.forEach( (guild, index) => {
					if(guild.available) {
						guild.defaultChannel.sendMessage(CurrencyUser.defaults.paycheck.msg);
					}
				});

			}).catch(console.error);
		}, CurrencyUser.defaults.paycheck.interval);
	}

	static extractUsername(fullUsername) {
		//currencyUser:username ->>> username
		return fullUsername.substring(13);
	}

	static defaults = {
		startingBal: 200,
		paycheck: {
			interval: timeConvert('hr', 1),
			amount: 60,
			msg: '@here Paycheck received (**$60**)! Next paycheck in 1 hour.'
		},
		msgs: {
			noBankAcc: 'You do not currently have a bank account. You can make one using **!makeBankAcc**'
		}
	}

}

export function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance

	CurrencyUser.initPaycheck(DiscordClient);

	DiscordClient.defineAction('makeBankAcc', msg => {
		CurrencyUser.exists(msg.author.username).then(exists => {
			if(!exists) {
				msg.reply(`Your new bank account has been credited with **$${CurrencyUser.defaults.startingBal}.** You can check your balance by running **!bal**.`).catch(console.log);
				return CurrencyUser.create(msg.author.username);
			} else return msg.reply('You already have a bank account.');
		}).catch(console.log);
	});	

	DiscordClient.defineAction('bal', msg => {
		CurrencyUser.exists(msg.author.username, msg).then(exists => {
			if(exists) {
				let currentUser = new CurrencyUser(msg.author.username);
				return currentUser.bal('GET');
			} else return Promise.reject(`User ${msg.author.username} doesn't exist`);
		}).then(bal => msg.reply(`Your current balance is **$${bal}**.`)).catch(console.log);
	});

	DiscordClient.defineAction('pay', (msg, args) => {
		CurrencyUser.exists(msg.author.username, msg).then(exists => {
			if(exists) {
				let receiver = args[0],
					amount = parseInt(args[1]);

				return new CurrencyUser(msg.author.username).transferBalance(receiver, amount).then(() => msg.reply(`You successfully transfered **$${amount}** to **${receiver}**.`));

			} else return Promise.reject();
		}).catch(err => {
			if(err) {
				console.error(err);
				msg.reply(err).catch(console.error);
			}
		});	
	}, {
		usage: '!pay <user> <amount>',
		requiredParams: 2
	});

	//games

	DiscordClient.defineAction('coinflip', (msg, args) => {
		// 0 = heads , 1 = tails
		const transformer = num => num === 0 ? 'heads' : 'tails'; 

		let wager = parseInt(args[0]),
			userSide = args[1].toLowerCase() === 'heads' ? 0 : 1,
			pcSide = Math.floor(Math.random() * 2);

		CurrencyUser.exists(msg.author.username, msg).then(exists => {
			if(exists) {
				let currentUser = new CurrencyUser(msg.author.username);
				return currentUser.bal('GET');
			} else return Promise.reject(`User ${msg.author.username} doesn't have a bank account.`);
		}).then(bal => {

			let currentUser = new CurrencyUser(msg.author.username);

			if(wager <= bal) {
				if(userSide === pcSide) {
					//the user won
					msg.reply(`You won **$${wager}**! The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
					return currentUser.bal('INCR', wager);
				} else {
					//he didn't
					msg.reply(`You lost **$${wager}**. The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
					return currentUser.bal('DECR', wager);
					
				}
			} else return msg.reply(`You do not have enough money. Your current balance is **$${bal}**.`);

		}).catch(console.log);
		
	}, {
		usage: '!coinflip <wager> <side>',
		requiredParams: 2
	});	

	//utils

	DiscordClient.defineAction('leaderboard', msg => {
		CurrencyUser.constructLeaderboard().then(leaderboard => {
			let textLeaderboard = ``;
			let i = 1;
			leaderboard.forEach( (user, index) => {
				if(index === 0) {
					textLeaderboard += `**${i}.** :first_place: ${user.username} - **$${user.bal}**\n\n`;
				} else if(index === 1) {
					textLeaderboard += `**${i}.** :second_place: ${user.username} - **$${user.bal}**\n\n`;
				} else if(index === 2) {
					textLeaderboard += `**${i}.** :third_place: ${user.username} - **$${user.bal}**\n\n`;
				} else textLeaderboard += `**${i}.** ${user.username} - **$${user.bal}**\n\n`;
				
				i++;
			});
			return msg.channel.sendMessage(textLeaderboard);
		}).catch(console.error);
	});
}