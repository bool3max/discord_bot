//workflow
	//a user makes a new account
	//it is saved locally in currencyUsers obj, and immediately saved in the db with CurrencyUser.saveEntire()
	//let's say that the user somehow updates his balance, let's say by winning a game
	//we use the 'balance' method to update the balance locally, but we also set it in the db
	//let's say the user wants to check his balance
	//we're gonna get his balance only locally (not form the db, but from the currencyusers object), since the data on the db and the local data are always the same
	//when the bot is shut down, we go through all users and run CurrencyUsers.saveEntire() on them
	//when we start the bot again, we go through all the hashes in redis, and we import them into the localCurrencyUsers object


import redis from 'redis';
const db = redis.createClient(); //we create a redis db instance on localhost:6379
db.on('error', err => console.log(err));

class CurrencyUser {
	constructor(username, bal = CurrencyUser.startingBalance) {
		//this.bal represence the balace as an integer. it's not recommended to modify it directly as the bal won't be stored in the db (or atleast not before the bot is shut down). instead, the .balance() method should be used
		this.bal = bal; //the initial balance is always 500
		this.username = username; //the username should be the username on Discord (not nickname, without #0000)
	}

	balance(action, amount) {
		//first it was a setter which didn't work if we wanted to increment or decrement it (+= or -=), then it was 3 seperate methods (too repetitive), now it's 1 method with an action
		switch(action) {
			case 'INC': 
				this.bal += amount;
				break;
			case 'DEC':
				this.bal -= amount;
				break;
			case 'SET':
				this.bal = amount;
				break;
			default:
				console.log(`UNSUPPORTED ACTION TYPE: ${action}`);
		}

		db.hset([`currencyUser:${this.username}`, 'bal', amount]); //we store the balance in the database
	}

	saveEntire() {
		//saves all of the user's data to the db (currently only balance and username)
		//NOTE: this should only be used when you want to save the entire user at once, if you're only updating individual properties, use the setters above
		db.hmset([`currencyUser:${this.username}`, 'bal', this.bal, 'username', this.username], redis.print);
	}

	static saveAll() {
		//goes through localCurrencyUsers and saves all local users to the db
		console.log('\b Saving all localCurrencyUsers into Redis db...');
		for(let username in localCurrencyUsers) localCurrencyUsers[username].saveEntire();
	}

	static exists(username) {
		if(localCurrencyUsers.hasOwnProperty(username)) return true
		else return false;
	}

	static startingBalance = 500
	static paycheck = {
		interval: 20000,
		amount: 200
	}
}

function importUsersFromDB() {
	//imports all users from the redis db into the localCurrencyUsers object
	db.keys('currencyUser:*', (err, keys) => {
		if(err) return console.log(err);
		keys.forEach((hashName, i, arr) => {
			db.hgetall(hashName, (err, props) => {
				if(err) return console.log(err);
				//props is an object containing all props and values of the hash (currencyUser)
				let {username, bal} = props;
				localCurrencyUsers[username] = new CurrencyUser(username, parseInt(bal)); //when we get the 'bal' from redis, it's a string and since our constructor's bal prop operates with numbers, we run parse it as a num
			});
		});
	});
}


const localCurrencyUsers = new Object();

importUsersFromDB();

export function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance
	DiscordClient.defineAction('makeBankAccount', msg => {
		if(!CurrencyUser.exists(msg.author.username)) {
			let newUser = new CurrencyUser(msg.author.username);
			newUser.saveEntire();
			localCurrencyUsers[msg.author.username] = newUser;
			msg.reply('You new bank account has been credited with $1000. You can check your balance by running /bal .');
		}
		else msg.reply('You already have a bank account.').catch(console.log);	
	}, {
		type: '/',
		static: true,
		nameSensitive: false
	});	

	DiscordClient.defineAction('bal', msg => {
		if(CurrencyUser.exists(msg.author.username)) {
			let currentUser = localCurrencyUsers[msg.author.username];
			 msg.reply(`Your current balance is $${currentUser.bal}`).catch(console.log);
		}
		else msg.reply('You do not currently have a bank account. You can make one using /makeBankAccount');
	}, {
		type: '/',
		static: true,
		nameSensitive: false
	});

}

process.on('SIGINT', CurrencyUser.saveAll); //when we quit the process, we run saveAll which goes through all local currency users and saves them to the db (just in case. theoretically they db should be up to date)

// process.on('SIGINT', () => {
// 	//TESTING, REMOVE LATER
// 	console.log(localCurrencyUsers);
// })