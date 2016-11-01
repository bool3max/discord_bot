import r_handler from '../utils/reject_handler';
import ChatCommand from '../ChatCommand';
import fetch from 'node-fetch';
import CurrencyUser from '../CurrencyUser';

const {steam_api_key} = require('../bot_config.json');

export const steam = new ChatCommand('steam', function(msg, args) {
	const currentUser = new CurrencyUser(msg.author.username);	
	let [subCmd, arg1] = args;
	currentUser.exists({msg}).then(() => {
		switch(subCmd) {
			case 'gethours': 
				if(!arg1) {
					return Promise.reject({msg, u: this.usageString});
				}

				return getSteamIDbyUsername(arg1, {msg}).then(id => {
					return fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steam_api_key}&steamid=${id}&include_appinfo=1`)
					.then(res => {
						if(res.ok) {
							return res.json();
						}
						return Promise.reject({msg, u: 'There was an error while processing your request.'});
					}).then(data => {
						let final = `\n\n**${arg1}** owns **${data.response.game_count}** games:\n\n`;
						data.response.games.forEach((game, i, arr) => {
							let toAttach = `**${game.name}**: ${(game.playtime_forever / 60).toFixed(1)} hours`;
							if(i !== arr.length - 1) {
								toAttach += '\n';
							}
							final += toAttach;
						});

						return msg.reply(final);

					});
				});

				break;	
			default: 
				return Promise.reject({msg, u: this.usageString});
		}
	}).catch(r_handler); 
}, {
	requiredParams: 1,
	usage: ['!steam gethours <username>'], 
	aliases: ['st']
});

function getSteamIDbyUsername(username, rejObj) {
	return fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steam_api_key}&vanityurl=${username}`).
	then(res => res.json()).then(data => {
		if(data.response.success !== 1 || !data.response.steamid) {
			console.log('bad rejecting')
			console.log(data)
			return Promise.reject(Object.assign({
				u: `The user **${username}** doesn't exist on Steam.`
			}, rejObj));
		}
		return Promise.resolve(data.response.steamid);
	});
}