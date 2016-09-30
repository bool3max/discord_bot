import mergeDefaults from './utils/merge_defaults';

export default function extend(Client) {
	Client.prototype.defineAction = function(actionName, callback, options = new Object() ) { 
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
			//discord messages are automatically trimmed therefore i don't need to trim them here
			if(options.caseSensitive) {
				if(content.startsWith(`${options.prefix}${actionName}`)) return true;
				return false;
			} else {
				if(content.toLowerCase().startsWith(`${options.prefix.toLowerCase()}${actionName.toLowerCase()}`)) return true;
				return false;
			}
		}
		
		this.on('message', msg => {
			console.log(msg.content, called(msg.content));

			// const {content} = msg,
			// 	  {username} = msg.author;
			
			// let regexString = `^${options.prefix}${actionName}( \\S+){${options.requiredParams}}`, 
			// 	regex = new RegExp(regexString, 'i');

			// if(options.caseSensitive) {
			// 	regex = new RegExp(regexString);
			// }	

			// if(called(content)) {
			// 	if(regex.test(content)) {
			// 		let args = content.substring(options.prefix.length + actionName.length + 1).split('');
			// 		options.requiredParams === 0 ? callback(msg) : callback(msg, args);
			// 	} else {
			// 		msg.reply(`Usage: ${options.usage}`).catch(console.log);
			// 	}

			//}

		});
	}
}