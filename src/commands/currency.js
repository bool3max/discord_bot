import ChatCommand from '../ChatCommand';
import CurrencyUser from '../CurrencyUser';
import CVL from '../leaderboard';
import r_handler from '../utils/reject_handler';

export const makeBankAcc = new ChatCommand('makeBankAcc', msg => {
	CurrencyUser.create(msg.author.username, {msg}).then(() => msg.reply(`Your new bank account has been credited with **$${CurrencyUser.defaults.startingBal}.** You can check your balance by running **!bal**.`))
	.catch(r_handler);
});

export const bal = new ChatCommand('bal', msg => {
	new CurrencyUser(msg.author.username).bal('GET', null, {msg}).then(bal => msg.reply(`Your current balance is **$${bal}**.`)).catch(r_handler);
});

export const pay = new ChatCommand('pay', (msg, args) => {
	let [receiver, amount] = args;

	new CurrencyUser(msg.author.username).transferBalance(receiver, amount, {msg}).then(() => msg.reply(`You successfully transfered **$${amount}** to **${receiver}**.`)).catch(r_handler);
}, {
	usage: '!pay <user> <amount>',
	requiredParams: 2
});

// export const coinflip = new ChatCommand('coinflip', (msg, args) => {
// 	// 0 = heads , 1 = tails
// 	const transformer = num => num === 0 ? 'heads' : 'tails'; 

// 	let wager = args[0],
// 		userSide = args[1].toLowerCase() === 'heads' ? 0 : 1,
// 		pcSide = Math.floor(Math.random() * 2),
// 		currentUser = new CurrencyUser(msg.author.username);

// 	currentUser.bal('GET', null, {msg}).then(bal => {
// 		if(wager <= bal) {
// 			if(userSide === pcSide) {
// 				//the user won
// 				msg.reply(`You won **$${wager}**! The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
// 				return currentUser.bal('INCR', wager, {msg});
// 			} else {
// 				//he didn't
// 				msg.reply(`You lost **$${wager}**. The coin landed on **${transformer(pcSide)}**!`).catch(console.log);
// 				return currentUser.bal('DECR', wager, {msg});
				
// 			}
// 		} else return Promise.reject({msg, u: `You do not have enough money. Your current balance is **$${bal}**.`});
// 	}).catch(r_handler);
// }, {
// 	usage: '!coinflip <wager> <side>',
// 	requiredParams: 2
// });

export const leaderboard = new ChatCommand('leaderboard', msg => {
	CVL({msg}).then(leaderboard => msg.channel.sendMessage(leaderboard)).catch(r_handler);
});