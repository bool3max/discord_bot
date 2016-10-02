import mergeDefaults from './utils/merge_defaults';
import CurrencyUser from './CurrencyUser';

export default function extend(Client) {
	Client.prototype.defineCommand = function(actionName, callback, options = new Object() ) { 
		const defaultOptions = {
			prefix: '!',
			requiredParams: 0,
			caseSensitive: false,
			cost: 0, //implemented using CurrencyUser
			usage: 'Usage string not defined for this action.' //unnecessary for actions with 0 requiredParams, since they cannot be wronly executed
		}

		options = mergeDefaults(options, defaultOptions);

		const called = content => {
			//discord messages are automatically trimmed therefore i don't need to trim them here
			if(options.caseSensitive) {
				return content.startsWith(`${options.prefix}${actionName}`)
			} else {
				return content.toLowerCase().startsWith(`${options.prefix.toLowerCase()}${actionName.toLowerCase()}`)
			}
		}
		
		const regex = / (?=[^"]*(?:"[^"]*"[^"]*)*$)/g;

		const handleValidation = (msg, content) => {
			//if validation is sucessful, it calls the callback and returns true, otherwise replies to the msg with the usage string, and returns false
			if(options.requiredParams < 1) {
				callback(msg);
				return true;
			} else {
				let args = content.substring(options.prefix.length + actionName.length + 1).split(regex).map( (arg, i) => {
					if(!Number.isNaN(Number(arg))) {
						return Number(arg);
					} else {
						//it cannot be converted to a number, therefore it's a string
						if(arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"') {
							return arg.substring(1, arg.length -1);
						}
						return arg;
					}
				});
				if(args.length < options.requiredParams) {
					msg.reply(options.usage).catch(console.error);
					return false;
				} else {
					callback(msg, args);
					return true;						
				}
			}
		}

		this.on('message', msg => {


			const {content} = msg,
				  {username} = msg.author;
			let currentUser;

			if(called(content)) {
				if(options.cost === 0) {
					handleValidation(msg, content);
				} else {
					let currentUser;
					CurrencyUser.exists(username, msg).then(exists => {
						if(exists) {
							currentUser = new CurrencyUser(username);
							return currentUser.bal('GET');
						} else {
							return Promise.reject('User doesn\'t exist');
						}
					}).then(bal => {
						if(bal >= options.cost) {
							if(handleValidation(msg, content)) {
								return currentUser.bal('DECR', options.cost);
							} else {
								return Promise.reject('Action wrongly executed.');
							}
							
						} else {
							msg.reply(`You do not have enough money. This action costs **$${options.cost}**. Your current balance is **$${bal}**`).catch(console.error);
							return Promise.reject('User not enough money');
						}
					}).catch(console.error);
				}
			}

		});
	}
}

							



