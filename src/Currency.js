import redis from 'redis';
const db = redis.createClient(); //we create a redis db instance on localhost:6379
db.on('error', err => console.log(err));

class CurrencyUser {
	constructor(username) {
		this.balance = 1000;
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	save() {
		db.hmset([`currencyUser:${this.username}`, 'balance', this.balance], redis.print);
	}
}


const currencyUsers = new Array();



export function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance

	DiscordClient.defineAction('makeBankAccount', msg => {
		let newUser = new CurrencyUser(msg.author.username);
		currencyUsers.push(newUser);
		msg.reply('You new bank account has been granted with $1000. You can check your balance by running /bal .');
		console.log(currencyUsers);
	}, {
		type: '/',
		static: true,
		nameSensitive: false
	});	

}