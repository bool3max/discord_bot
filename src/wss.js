import ws from 'ws';
import {createSubscriber as createSub} from './db/database';

let sub;

const wss = new ws.Server({port: require('./bot_config.json').wss_port}, () => {
	sub = createSub('leaderboard_json', (channel, json) => {
		wss.clients.forEach(client => client.send(json));
	});
});

