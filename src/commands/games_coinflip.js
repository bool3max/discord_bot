import ChatCommand from '../ChatCommand';
import db from '../db/database';
import CurrencyUser from '../CurrencyUser';

export const coinflip = new ChatCommand('coinflip', function(msg, args) {
	console.log(this.options)
}, {
	requiredParams: 1,
	usage: ['!coinflip list', '!coinflip make <amount> <side>', '!coinflip join <username>']
});

//!coinflip list