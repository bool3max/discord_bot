import db from './db/database';
import CurrencyUser from './CurrencyUser';
import r_handler from './utils/reject_handler';


export default class ChatCommand {
	constructor(commandName, callback, options = new Object() ) {

		this.commandName = commandName; 
		this.callback = callback;
		this.options = Object.assign({
			prefix: '!',
			requiredParams: 0,
			caseSensitive: false,
			exec_cost: 0, //implemented using CurrencyUser
			buyPrice: 0, //if it's greater than 0, that means that it can (must) be bought before using
			usage: 'Usage string not defined for this action.' //unnecessary for actions with 0 requiredParams, since they cannot be wronly executed
		}, options);

		if(this.options.buyPrice > 0) {
			//if the command is buyable (price is greater than 0), we'll store it's price in the database, to later be used by !purchaseCommand
			db.hsetAsync('commandPrices', commandName.toLowerCase(), this.options.buyPrice).then(reply => {
				//in the db, command names are ALWAYS all lowercase
				console.log(`Sucessfully set command: ${commandName}'s price (${this.options.buyPrice}) in the database.`);
			}).catch(r_handler);
		}

	}	

	called(content) {
		//returns true if the command was called in the content string, false otherwise
		const calledWrapper = compareAgainst => {
			if(this.options.caseSensitive) {
				return content.startsWith(`${this.options.prefix}${compareAgainst}`)
			} else {
				return content.toLowerCase().startsWith(`${this.options.prefix.toLowerCase()}${compareAgainst.toLowerCase()}`)
			}
		}

		if(calledWrapper(this.commandName)) {
			return {
				called: true,
				with: this.commandName
			}
		} else if(this.options.aliases && Array.isArray(this.options.aliases) && this.options.aliases.length >= 1) {
			let retValue;

			for(let i = 0; i < this.options.aliases.length; i++) {
				let alias = this.options.aliases[i];

				if(calledWrapper(alias)) {
					return retValue = {
						called: true,
						with: alias
					}
				}

				if(i === this.options.aliases.length - 1) {
					retValue = {
						called: false
					}
				}
			}

			return retValue;
		} else {
			return {
				called: false
			}
		}
	}

	handleValidation(content, calledWith, rejObj = new Object()) {
		//returns a promise that resolves (with args, if any are needed) if 'content' is in par with all 'options', rejects with the usage string otherwise
		//calledWith is a string that represents the command name that comes after the prefix, necessary because of aliases
		if(this.options.requiredParams < 1) {
			return Promise.resolve();
		}

		const fullCommand = content.substring(this.options.prefix.length + calledWith.length + 1);

		if(fullCommand === '') {
			return Promise.reject(Object.assign({
				u: this.usageString
			}, rejObj));
		}

		const regex = / (?=[^"]*(?:"[^"]*"[^"]*)*$)/g;
		let args = fullCommand.split(regex).map( (arg, i) => {
			if(!Number.isNaN(Number(arg))) {
				return Number(arg);
			} else {
				//it cannot be converted to a number, therefore it's a string
				if(arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"') {
					return arg.substring(1, arg.length - 1);
				}
				return arg;
			}
		});

		if(args.length < this.options.requiredParams) {
			return Promise.reject(Object.assign({
				u: this.usageString,
				d: 'Action wrongly executed'
			}, rejObj));
		} else {
			return Promise.resolve(args);
		}
	}

	process(msg) {
		const calledDetails = this.called(msg.content);

		if(calledDetails.called) {
			if(this.options.buyPrice === 0 && this.options.exec_cost === 0) {
				return this.handleValidation(msg.content, calledDetails.with, {msg}).then(args => this.callback(msg, args)).catch(r_handler);
			}

			const currentUser = new CurrencyUser(msg.author.username);
			let userBal,
				userArgs;

			this.handleValidation(msg.content, calledDetails.with, {msg}).then(args => userArgs = args).then(() => currentUser.bal('GET', null, {msg})).then(bal => {
				userBal = bal;
			}).then(() => {
				let proms = new Array();

				if(this.options.buyPrice > 0) {
					let prom = currentUser.hasCommand(this.commandName).then(hasCommand => {
						if(hasCommand) {
							return Promise.resolve();
						} else {
							return Promise.reject({msg, u: `You do not own the **${this.commandName}** command. You can purchase it by running: **!purchaseCmd ${this.commandName}**.`})
						}
					});

					proms.push(prom);
				}

				if(this.options.exec_cost > 0) {
					let prom = new Promise((resolve, reject) => {
						if(userBal >= this.options.exec_cost) {
							resolve();
						} else {
							reject({msg, u: `You do not have enough money. This command costs **$${this.options.exec_cost}**, and your current balance is **$${userBal}**`});
						}
					}).then(() => currentUser.bal('DECR', this.options.exec_cost, {msg}));

					proms.push(prom);
				}

				return Promise.all(proms);
			}).then(() => this.callback(msg, userArgs)).catch(r_handler);
		}
	}

	get usageString() {
		//returns a string that should be sent to the user if the command is wrongly executed
		if(Array.isArray(this.options.usage) && this.options.usage.length >= 2) {
			//its an array, we're going to account for ATLEAST 2 elemnts
			let usageString = '';
			this.options.usage.forEach((str, i, arr) => {
				if(i === arr.length - 1) {
					return usageString += str;
				}
				usageString += `${str} **OR** `;
			});
			return `Usage: ${usageString}`;
		} 

		return `Usage: ${this.options.usage}`;
	}
}