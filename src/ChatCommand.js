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
			db.hsetAsync('commandPrices', commandName.toLowerCase(), this.options.buyPrice).then( () => {
				//in the db, command names are ALWAYS all lowercase
				console.log(`Sucessfully set command: ${commandName}'s price (${this.options.buyPrice}) in the database.`);
			}).catch(r_handler);
		}

	}	

	called(content) {
		//returns true if the command was called in the content string, false otherwise
		const calledWrapper = cmdName => {
			if(this.options.caseSensitive) {
				return content.startsWith(`${this.options.prefix}${cmdName}`)
			} else {
				return content.toLowerCase().startsWith(`${this.options.prefix.toLowerCase()}${cmdName.toLowerCase()}`)
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

	//check arguments, run deduct_exec_cost, if it resolves, run the core of the command

	process(msg) {
		const calledDetails = this.called(msg.content);

		if(calledDetails.called) {

			let deduct_exec_cost,
				userArgs;

			const currentUser = new CurrencyUser(msg.author.username);

			if(this.options.exec_cost > 0) {
				deduct_exec_cost = () => {
					//returns a promise that resolves if bal was deducted sucessfully, rejects otherwise
					return CurrencyUser.exists(currentUser.username, {msg}).then(() => currentUser.bal('GET', null, {msg})).then(bal => {
						if(bal >= this.options.exec_cost) {
							return currentUser.bal('DECR', this.options.exec_cost, {msg});
						} else {
							return Promise.reject({msg, u: `You do not have enough money. This command costs **$${this.options.exec_cost}**, and your current balance is **$${bal}**.`});
						}
					});
				}
			}

			if(this.options.buyPrice === 0) {
				//if there's no buyPrice, we go through the validation process and call the callback
				return this.handleValidation(msg.content, calledDetails.with, {msg}).then(args => this.callback(msg, args, deduct_exec_cost)).catch(r_handler);
			}

			//if there is buyPrice

			this.handleValidation(msg.content, calledDetails.with, {msg}).then(args => userArgs = args).then(() => CurrencyUser.exists(currentUser.username, {msg})).then(() => currentUser.hasCommand(this.commandName)).then(hasCommand => {
				if(hasCommand) {
					return Promise.resolve();
				} else {
					return Promise.reject({msg, u: `You do not own the **${this.commandName}** command. You can purchase it by running: **!purchaseCmd ${this.commandName}**.`});
				}
			}).then(() => this.callback(msg, userArgs, deduct_exec_cost)).catch(r_handler);
		}
	}

	get usageString() {
		//returns a string that should be sent to the user if the command is wrongly executed
		let final = '\n\n**Usage:**\n';

		if(Array.isArray(this.options.usage) && this.options.usage.length >= 2) {
			//its an array, we're going to account for ATLEAST 2 elemnts
			this.options.usage.forEach((str, i, arr) => {
				if(i === arr.length - 1) {
					return final += `\n${str}`;
				}
				final += `\n${str} **OR**`;
			});
		} else {
			final += `\n${this.options.usage}`;
		}

		if(this.options.aliases) {
			final += '\n\n**Aliases:**\n\n';
			final += this.options.aliases.map(alias => this.options.prefix + alias).join(', ');
		}
		
		return final;
	}
}