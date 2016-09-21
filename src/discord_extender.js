import mergeDefaults from './utils/merge_defaults';

export default function extend(Client) {
	Client.prototype.specificUsers = function(users, cb) {
		//execute an action when a specific user(s) sends a message
		this.on('message', msg => {
			switch(typeof users) {
				case 'string':
					if(msg.author.username === users) cb(msg);
					break;
				case 'object':
					if(users instanceof Array) {
						if(users.includes(msg.author.username)) cb(msg);
					}
					else console.error(new Error('users is obj, but not an arr'));
					break;
				default: 
					console.error(new Error('UNDEFINED TYPE'));
			}	
		});
	}

	Client.prototype.defineAction = function(actionName, callback, options = new Object() ) {
		//TODO: modify regex string to allow for 
		//for now it's a very basic rewrite
		const defaultOptions = {
			prefix: '!',
			requiredParams: 0,
			paramSeperator: ' ',
			caseSensitive: false,
			usage: 'Usage string not defined for this action.' //unnecessary for actions with 0 requiredParams, since they cannot be wronly executed
		}

		options = mergeDefaults(options, defaultOptions);

		const called = content => {
			if( (options.caseSensitive && content.startsWith(`${options.prefix}${actionName}`)) || (!options.caseSensitive && content.toLowerCase().startsWith(`${options.prefix.toLowerCase()}${actionName.toLowerCase()}`))) {
				return true;
			} else return false;
		}; //returns true if 'content' starts with the action pattern
		
		this.on('message', msg => {

			const {content} = msg,
				  {username} = msg.author;
			
			let regexString = `^${options.prefix}${actionName}( \\S+){${options.requiredParams}}`, 
				regex = new RegExp(regexString, 'i');

			if(options.caseSensitive) {
				regex = new RegExp(regexString);
			}	

			if(called(content)) {
				if(regex.test(content)) {
					let args = content.substring(options.prefix.length + actionName.length + 1).split(options.paramSeperator);
					options.requiredParams === 0 ? callback(msg) : callback(msg, args);
				} else {
					msg.reply(`Usage: ${options.usage}`).catch(console.log);
				}

			}

		});
	}

	Client.prototype.instantDelete = function(username, cb) {
		//automatically deletes the message of the specified user
		//username must be an actual username and not a nickname on a server
		//username can also be an array
		//cb gets called when the user's message is deleted and if there's no errors
		this.specificUsers(username, msg => msg.delete().then(cb).catch(console.error));
	}
}