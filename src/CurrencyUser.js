import db from './database';
import timeConvert from './utils/time_converter';

export default class CurrencyUser {
	//a class that represents a currencyUser in the batabase
	//NOTE: do not create instances of this class with an username that doesn't exist. instead use CurrencyUser.create() to create a new user in the db (static method)
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

	purchaseCommand(commandName) {
		return this.getOwnedCommands().then(cmds => {
			//we get the commands as an array, but we want to store them in the cmd1,cmd2,cmd3 format
			cmds.push(commandName);
			let storedValue = cmds.join(',');

			return db.hsetAsync(`currencyUser:${this.username}`, 'ownedCommands', storedValue);
		});
	}

	getOwnedCommands() {
		return db.hgetAsync(`currencyUser:${this.username}`, 'ownedCommands').then(ownedCommands => Promise.resolve(ownedCommands.split(',')));
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