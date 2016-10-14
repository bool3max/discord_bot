import redis from 'redis';
import {promisifyAll} from 'bluebird';
import r_handler from './utils/reject_handler';
import CVL from './leaderboard';

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const db = redis.createClient({
	password: 'a45hgf678nopzx48712yy3cc0',
	string_numbers: false
});

db.on('error', r_handler);

export default db;
export function createSubscriber(channel, onMessage) {
	const sub = redis.createClient({
		password: 'a45hgf678nopzx48712yy3cc0'
	});
	sub.on('message', onMessage);
	sub.subscribe(channel);
	return sub;
}
export function publishLeaderboard(channel = 'leaderboard') {
	console.log(`Attempting to publish the leaderboard to the ${channel} channel`);
	//publishes a new visualLeaderboard string to the 'channel' channel
	return CVL().then(leaderboard => db.publishAsync(channel, leaderboard));
}