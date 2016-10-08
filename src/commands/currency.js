import CurrencyUser from '../CurrencyUser';
import r_handler from '../utils/reject_handler';

export default function extend(DiscordClient) {
	//takes an INSTANCE of a discord client, extends it with needed methods
	//NOTE: must be ran in the ready event of the instance

	CurrencyUser.initPaycheck(DiscordClient);

	DiscordClient.defineCommand('makeBankAcc', msg => {
		CurrencyUser.create(msg.author.username, {msg}).then(() => msg.reply(`Your new bank account has been credited with **$${CurrencyUser.defaults.startingBal}.** You can check your balance by running **!bal**.`))
		.catch(r_handler);
	});	

	DiscordClient.defineCommand('bal', msg => {
		new CurrencyUser(msg.author.username).bal('GET', null, {msg}).then(bal => msg.reply(`Your current balance is **$${bal}**.`)).catch(r_handler);
	});

	DiscordClient.defineCommand('pay', (msg, args) => {
		let [receiver, amount] = args;

		new CurrencyUser(msg.author.username).transferBalance(receiver, amount, {msg}).then(() => msg.reply(`You successfully transfered **$${amount}** to **${receiver}**.`)).catch(r_handler);

	}, {
		usage: '!pay <user> <amount>',
		requiredParams: 2
	});

	//games

	DiscordClient.defineCommand('coinflip', (msg, args) => {
		// 0 = heads , 1 = tails
		const transformer = num => num === 0 ? 'heads' : 'tails'; 

		let wager = args[0],
			userSide = args[1].toLowerCase() === 'heads' ? 0 : 1,
			pcSide = Math.floor(Math.random() * 2),
			currentUser = new CurrencyUser(msg.author.username);

		currentUser.bal('GET', null, {msg}).then(bal => {
			if(wager <= bal) {
				if(userSide === pcSide) {
					//the user won
					msg.reply(`You won **$${wager}**! The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
					return currentUser.bal('INCR', wager, {msg});
				} else {
					//he didn't
					msg.reply(`You lost **$${wager}**. The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
					return currentUser.bal('DECR', wager, {msg});
					
				}
			} else return Promise.reject({msg, u: `You do not have enough money. Your current balance is **$${bal}**.`});
		}).catch(r_handler);
		
	}, {
		usage: '!coinflip <wager> <side>',
		requiredParams: 2
	});	

	//utils

	DiscordClient.defineCommand('leaderboard', msg => {
		CurrencyUser.constructLeaderboard().then(leaderboard => {
			let textLeaderboard = ``;
			let i = 1;
			leaderboard.forEach( (user, index) => {
				if(index === 0) {
					textLeaderboard += `**${i}.** :first_place: ${user.username} - **$${user.bal}**\n\n`;
				} else if(index === 1) {
					textLeaderboard += `**${i}.** :second_place: ${user.username} - **$${user.bal}**\n\n`;
				} else if(index === 2) {
					textLeaderboard += `**${i}.** :third_place: ${user.username} - **$${user.bal}**\n\n`;
				} else textLeaderboard += `**${i}.** ${user.username} - **$${user.bal}**\n\n`;
				
				i++;
			});
			return msg.channel.sendMessage(textLeaderboard);
		}).catch(console.error);
	});
}