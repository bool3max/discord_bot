import db from './db/database';
import timeConvert from './utils/time_converter';
import r_handler from './utils/reject_handler';
import {pubLeaderboard} from './db/publishers';

export default class CurrencyUser {
	//a class that represents a currencyUser in the batabase
	constructor(username) {
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	bal(action, amount, rejObj = new Object()) {	
		//resolves if the operation was succesfull
		//it is recommended that you pass a number to AMOUNT (it's automatically converted to a string before saving it to discord)
		//does not check whether the user has enough money upon 'DECR'
		return CurrencyUser.exists(this.username, rejObj).then(() => {
			switch(action) {
				case 'INCR': 
					return db.hincrbyAsync(`currencyUser:${this.username}`, ['bal', amount]).then( () => pubLeaderboard.all());
					break;
				case 'DECR':
					return db.hincrbyAsync(`currencyUser:${this.username}`, ['bal', -amount]).then( () => pubLeaderboard.all());
					break;
				case 'SET':
					return db.hsetAsync(`currencyUser:${this.username}`, ['bal', amount]).then( () => pubLeaderboard.all());
					break;
				case 'GET':
					return db.hgetAsync(`currencyUser:${this.username}`, ['bal']).then(bal => parseInt(bal));
					//NOTE: returns a number
					break;
				default:
					return Promise.reject({d: `UNSUPPORTED ACTION TYPE: ${action}`});
			}
		});
	} //done

	get() {
		//returns a promise that resolves with the user object in the database
		return CurrencyUser.getUser(this.username);
	} //done

	transferBalance(receiver, amountToTransfer, rejObj = new Object()) {
		return CurrencyUser.exists(this.username, rejObj).then(() => this.bal('GET', null, rejObj)).then(bal => {
			if(amountToTransfer <= bal) {
				return CurrencyUser.exists(receiver, {msg: rejObj.msg, d: rejObj.d, u: `**${receiver}** doesn't have a bank account.`});
			} else {
				return Promise.reject({msg: rejObj.msg, d: rejObj.d, u: `You do not have enough money. Your current balance is **$${bal}**.`})
			}
		}).then(() => new CurrencyUser(receiver).bal('INCR', amountToTransfer, rejObj)).then(() => this.bal('DECR', amountToTransfer, rejObj));
	} //done

	purchaseCommand(commandName, rejObj = new Object()) {
		commandName = commandName.toLowerCase();
		let commandPrice;

		return CurrencyUser.exists(this.username, rejObj).then(() => {
			return db.hexistsAsync('commandPrices', commandName);
		}).then(exists => {
			if(exists) {
				return db.hgetAsync('commandPrices', commandName);
			} else {
				return Promise.reject({u: 'That command doesn\'t exist or is not purchasable.', msg: rejObj.msg, d: rejObj.d});
			}
		}).then(price => {
			commandPrice = Number(price);//price is, from the db, returned as a string, therfore we set the price as an interger, later to be used by CurrencyUser.bal
			return this.bal('GET', null, rejObj); 
		}).then(bal => {
			if(bal >= commandPrice) {
				return this.getOwnedCommands(rejObj);
			} else {
				return Promise.reject({
					msg: rejObj.msg,
					d: rejObj.d,
					u: `You do not have enough money. This command costs **$${commandPrice}**. Your current balanc is **$${bal}**`
				});
			}
		}).then(ownedCmds => {
			if(!ownedCmds.includes(commandName)) {
				ownedCmds.push(commandName);
				let storedValue = ownedCmds.join(',');
				return db.hsetAsync(`currencyUser:${this.username}`, 'ownedCommands', storedValue);
			} else {
				return Promise.reject({u: 'You already own that command.', msg: rejObj.msg});
			}
		}).then(() => this.bal('DECR', commandPrice, rejObj));
	}

	getOwnedCommands(rejObj = new Object()) {
		//resolves with an array of lowercase strings (command names), or an empty array
		return CurrencyUser.exists(this.username, rejObj).then(() => {
			return db.hgetAsync(`currencyUser:${this.username}`, 'ownedCommands').then(ownedCommands => {
				return ownedCommands !== '' ? Promise.resolve(ownedCommands.split(',')) : Promise.resolve(new Array());
			});
		});
	} //done

	hasCommand(commandName) {
		return this.getOwnedCommands().then(ownedCmds => {
			if(ownedCmds.includes(commandName.toLowerCase())) {
				return Promise.resolve(true);
			} else {
				return Promise.resolve(false);
			}
		});
	}

	static create(username, rejObj = new Object(), bal = CurrencyUser.defaults.startingBal) {
		//returns a promise that resolves if the user was successfully created
		return db.existsAsync(`currencyUser:${username}`).then(exists => {
			if(!exists) {
				return db.hmsetAsync(`currencyUser:${username}`, ['username', username, 'bal', bal, 'ownedCommands', '']);
			} else {
				return Promise.reject({msg: rejObj.msg, u: 'You already own a bank account.', d: `user: ${username} already exists in database`});
			}
		});
	} //done

	static getUser(username) {
		//returns a js object, not an instace of CurrencyUser
		return CurrencyUser.exists(username).then(() => db.hgetallAsync(`currencyUser:${username}`));

	} //done

	static getAll(rejObj = new Object()) {
		//returns a promise that resolves with an arr of all users in db
		return db.keysAsync('currencyUser:*').then(keys => {
			if(!keys.length) {
				return Promise.reject({msg: rejObj.msg, u: 'No users in database.',d: 'No users in database.'});
			}
			return Promise.all(keys.map( (username, i) => CurrencyUser.getUser( CurrencyUser.extractUsername(username) ) ));
		});
	} //done

	static exists(username, rejObj = new Object()) {
		//resolves if the user exists, rejects with the rejObj if it doesn't. should be catched with r_handler
		return db.existsAsync(`currencyUser:${username}`).then(exists => {
			return exists ? Promise.resolve() : Promise.reject({
				u: CurrencyUser.defaults.msgs.noBankAcc,
				d: `user: ${username} doesn't exist`, 
				msg: rejObj.msg
			});
		});
	} //done

	static initPaycheck(DiscordClient) {
		setInterval(() => {
			console.log('Paycheck cycle.');
			CurrencyUser.getAll().then(users => {
				return Promise.all(users.map( (user, i) => new CurrencyUser(user.username).bal('INCR', CurrencyUser.defaults.paycheck.amount)));
			}).then(() => {
				const guilds = DiscordClient.guilds.array();
				guilds.forEach( (guild, index) => {
					if(guild.available) {
						guild.defaultChannel.sendMessage(CurrencyUser.defaults.paycheck.msg);
					}
				});

			}).catch(r_handler);
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
			noBankAcc: 'You do not currently have a bank account. You can make one using **!makeBankAcc**',
			alreadyBankAcc: 'You already own a bank account.'
		}
	}

}