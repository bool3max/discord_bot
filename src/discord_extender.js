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

	Client.prototype.defineAction = function(actionName, cb, options = {
		type: '/',
		static: true,
		nameSensitive: true,
		specificUsers: null,
		notify: false //if true, and if specific users is an array, it will notify the users who are not in the arr, but have tried to execute the action
	}) {
		this.on('message', msg => {

			if( (options.nameSensitive && msg.content.startsWith(`${options.type}${actionName}`)) || (!options.nameSensitive && msg.content.toLowerCase().startsWith(`${options.type}${actionName.toLowerCase()}`)) ) {
				if(options.static) {
					if(!options.specificUsers) cb(msg)
					else if(options.specificUsers && options.specificUsers.includes(msg.author.username)) cb(msg)
					else if(options.notify && options.specificUsers && !options.specificUsers.includes(msg.author.username)) msg.reply('You do not have the permission to execute this action.');	
				}
				else {
					let args = msg.content.substr(options.type.length + actionName.length + 1).split(', '); //length of the type + the name, and an additional 1 for the space before the first parameter
					//the arguments are split by a comma, and then a space
					if(!options.specificUsers) cb(args, msg)
					else if(options.specificUsers && options.specificUsers.includes(msg.author.username)) cb(args, msg)
					else if(options.notify && options.specificUsers && !options.specificUsers.includes(msg.author.username)) msg.reply('You do not have the permission to execute this action.');
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