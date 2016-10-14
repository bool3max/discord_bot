import {createSubscriber as createSub} from './database';
import r_handler from './utils/reject_handler';
import CVL from './leaderboard';

export default function extend(DiscordClient) {
	const clientGuilds = DiscordClient.guilds.array();

	Promise.all(clientGuilds.map( (guild, i) => {
		if(guild.available) {
			console.log(`Currently processing guild: ${guild.name}`);

			if(!guild.channels.find('name', '0life')) {
				//create the channel, return
				console.log('No channel with name: 0life, creating one now...');
				return guild.createChannel('0life', 'text');
			}

			return guild.channels.find('name', '0life');
		}
	})).then(getMessages).then(messages => {
		const sub = createSub('leaderboard', (channel, visualLeaderboard) => {
			messages.forEach(msg => {
				msg.edit(visualLeaderboard).catch(console.error);
			});
		});
	}).catch(console.log);
}

function getMessages(textChannels) {
	//loops through the textChannels, and if they don't have any messages, sends a message with the leaderboard
	//resolves with an array of all sent messages, and also the messages that already existed

	const makeCombo = txtChannel => new Promise((resolve, reject) => {
		txtChannel.fetchMessages().then(collection => resolve({txtChannel, collection}))
	});

	return Promise.all(textChannels.map(makeCombo)).then(combos => {
		return Promise.all(combos.map(combo => {
			if(combo.collection.size < 1) {
				return CVL().then(leaderboard => combo.txtChannel.sendMessage(leaderboard));
			} else {
				return Promise.resolve(combo.collection.last());
			}
		}));
	});

	// {
	// 	txtChannel: {...},
	// 	collection: Collection...
	// }

}