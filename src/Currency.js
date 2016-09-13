//workflow
	//a user makes a new account
	//it is saved locally in currencyUsers obj, and immediately saved in the db with CurrencyUser.saveEntire()
	//let's say that the user somehow updates his balance, let's say by winning a game
	//we use the 'balance' setter to update the balance locally, but we also set it in the db
	//let's say the user wants to check his balance
	//we're gonna get his balance only locally (not form the db, but from the currencyusers object), since the data on the db and the local data are always the same
	//when the bot is shut down, we go through all users and run CurrencyUsers.saveEntire() on them
	//when we start the bot again, we go through all the hashes in redis, and we import them into the currencyUsers object


import redis from 'redis';
const db = redis.createClient(); //we create a redis db instance on localhost:6379
db.on('error', err => console.log(err));

class CurrencyUser {
	constructor(username) {
		this.bal = 1000; //the initial balance is always 1000
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	set balance(amount) {
		this.bal = amount;
		db.hset([`currencyUser:${this.username}`, 'bal', amount]);
	}

	saveEntire() {
		//saves all of the user's data to the db (currently only balance and username)
		//NOTE: this should only be used when you want to save the entire user at once, if you're only updating individual properties, use the setters
		db.hmset([`currencyUser:${this.username}`, 'bal', this.bal, 'username', this.username], redis.print);
	}

	static saveAll() {
		//goes through localCurrencyUsers and saves all local users to the db
		console.log('Saving all localCurrencyUsers into Redis db...');
		for(let username in localCurrencyUsers) localCurrencyUsers[username].saveEntire();
	}
}


const localCurrencyUsers = new Object();

export function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance
	DiscordClient.defineAction('makeBankAccount', msg => {
		let currentUser = localCurrencyUsers[msg.author.username];
		if(!currentUser) {
			let newUser = new CurrencyUser(msg.author.username);
			newUser.saveEntire();
			localCurrencyUsers[msg.author.username] = newUser;
			msg.reply('You new bank account has been credited with $1000. You can check your balance by running /bal .');
		}
		else msg.reply('You already have a bank account.').catch(console.log);	
	}, {
		type: '/',
		static: true
	});	

	DiscordClient.defineAction('bal', msg => {
		let currentUser = localCurrencyUsers[msg.author.username];
		if(currentUser) msg.reply(`Your current balance is $${currentUser.bal}`).catch(console.log)
		else msg.reply('You do not currently have a bank account. You can make one using /makeBankAccount');
	}, {
		type: '/',
		static: true
	});

}

process.on('SIGINT', CurrencyUser.saveAll); //when we quit the process, we run saveAll which goes through all local currency users and saves them to the db (just in case. theoretically they db should be up to date)