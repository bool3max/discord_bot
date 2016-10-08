import db from './database';
import timeConvert from './utils/time_converter';
import r_handler from './utils/reject_handler.js'
import mergeDefaults from './utils/merge_defaults';

export default class CurrencyUser {
	//a class that represents a currencyUser in the batabase
	constructor(username) {
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	bal(action, amount, rejObj = new Object()) {
		//utility function for modifying the balance
		//returns a promise that resolves (with a value returned from redis) when the action is completed
		//it is recommended that you pass a number to AMOUNT (it's automatically converted to a string before saving it to discord)

		return CurrencyUser.exists(this.username, rejObj).then(() => {
			console.log('then from bal was fired');
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
				return Promise.reject(mergeDefaults(rejObj, {u: `That command doesn't exist or is not purchasable.`}));
			}
		}).then(price => {
			commandPrice = Number(price); //price is, from the db, returned as a string, therfore we set the price as an interger, later to be used by CurrencyUser.bal
			return this.getOwnedCommands(rejObj);
		}).then(ownedCmds => {
			if(!ownedCmds.includes(commandName)) {
				ownedCmds.push(commandName);
				let storedValue = ownedCmds.join(',');
				return db.hsetAsync(`currencyUser:${this.username}`, 'ownedCommands', storedValue);
			} else {
				return Promise.reject({u: 'You already own that command.', msg: rejObj.msg});
			}
		}).then(() => this.bal('DECR', commandPrice));
	}

	getOwnedCommands(rejObj = new Object()) {
		//resolves with an array of lowercase strings (command names), or an empty array
		return CurrencyUser.exists(this.username, rejObj).then(() => {
			return db.hgetAsync(`currencyUser:${this.username}`, 'ownedCommands').then(ownedCommands => {
				if(ownedCommands !== '') {
					return Promise.resolve(ownedCommands.split(','));
				} else {
					return Promise.resolve(new Array());
				}
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
				return Promise.reject(mergeDefaults(rejObj, {d: `user: ${username} already exists in database`, u: 'You already own a bank account.'}));
			}
		});
	} //done

	static getUser(username) {
		//returns a js object, not an instace of CurrencyUser
		return CurrencyUser.exists(username).then(() => db.hgetallAsync(`currencyUser:${username}`));
		//since we passed null to CurrencyUser.exists, it won't reply to any message, which is exactly what we want

	} //done

	static getAll() {
		//returns a promise that resolves with an arr of all users in db
		return db.keysAsync('currencyUser:*').then(keys => {
			if(!keys.length) {
				return Promise.reject({d: 'No users in database.'});
			}
			return Promise.all(keys.map( (username, i) => CurrencyUser.getUser( CurrencyUser.extractUsername(username) ) ));
		});
	} //done

	static exists(username, rejObj = new Object()) {
		//resolves if the user exists, rejects with the rejObj if it doesn't. should be catched with r_handler
		rejObj = mergeDefaults(rejObj, {
			u: CurrencyUser.defaults.msgs.noBankAcc,
			d: `user: ${username} doesn't exist`
		});
		return db.existsAsync(`currencyUser:${username}`).then(exists => {
			return exists ? Promise.resolve() : Promise.reject(rejObj);
		});
	} //done

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
				return Promise.all(users.map( (user, i) => new CurrencyUser(user.username).bal(null, 'INCR', CurrencyUser.defaults.paycheck.amount) ));
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