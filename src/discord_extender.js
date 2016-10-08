import mergeDefaults from './utils/merge_defaults';
import db from './database';
import CurrencyUser from './CurrencyUser';
import r_handler from './utils/reject_handler';

export default function extend(Client) {
	Client.prototype.defineCommand = function(commandName, callback, options = new Object() ) { 

		const defaultOptions = {
			prefix: '!',
			requiredParams: 0,
			caseSensitive: false,
			exec_cost: 0, //implemented using CurrencyUser
			buyPrice: 0, //if it's greater than 0, that means that it can (must) be bought before using
			usage: 'Usage string not defined for this action.' //unnecessary for actions with 0 requiredParams, since they cannot be wronly executed
		}

		options = mergeDefaults(options, defaultOptions);

		if(options.buyPrice > 0) {
			//if the command is buyable (price is greater than 0), we'll store it's price in the database, to later be used by !purchaseCommand
			db.hsetAsync('commandPrices', commandName.toLowerCase(), options.buyPrice).then(reply => {
				//in the db, command names are ALWAYS all lowercase
				console.log(`Sucessfully set command: ${commandName}'s price (${options.buyPrice}) in the database.`);
			}).catch(console.error);
		}

		const called = content => {
			//discord messages are automatically trimmed therefore i don't need to trim them here
			if(options.caseSensitive) {
				return content.startsWith(`${options.prefix}${commandName}`)
			} else {
				return content.toLowerCase().startsWith(`${options.prefix.toLowerCase()}${commandName.toLowerCase()}`)
			}
		}
		
		const regex = / (?=[^"]*(?:"[^"]*"[^"]*)*$)/g;

		const handleValidation = (msg, rejObject = new Object()) => {
			//if validation is sucessful, it calls the callback and returns true, otherwise replies to the msg with the usage string, and returns false
			if(options.requiredParams < 1) {
				callback(msg);
				return Promise.resolve();
			} else {
				let args = msg.content.substring(options.prefix.length + commandName.length + 1).split(regex).map( (arg, i) => {
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
				if(args.length < options.requiredParams) {
					return Promise.reject(mergeDefaults(rejObject, {u: options.usage, d: 'Action wrongly executed.'}));
				} else {
					callback(msg, args);
					return Promise.resolve(true);			
				}
			}
		}

		this.on('message', msg => {
			let currentUser;

			if(called(msg.content)) {

				if(options.exec_cost === 0) {
					return handleValidation(msg, {msg}).catch(r_handler);
				}

				let currentUser = new CurrencyUser(msg.author.username);

				currentUser.bal('GET', null, {msg}).then(bal => {
					console.log('dis did it')
					if(bal >= options.exec_cost) {
						return handleValidation(msg, {msg});
					} else {
						return Promise.reject({msg, u: `You do not have enough money. This action costs **$${options.exec_cost}**. Your current balance is **$${bal}**.`});
					}
				}).then(() => currentUser.bal('DECR', options.exec_cost, {msg})).catch(r_handler);

			}

		});
	}
}

							



