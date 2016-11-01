import redis from 'redis';
import {promisifyAll} from 'bluebird';
import r_handler from '../utils/reject_handler';

const {redis_pass} = require('../bot_config.json');

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const db = redis.createClient({
	password: redis_pass,
	string_numbers: false
});

db.on('error', r_handler);

export default db;
export function createSubscriber(channel, onMessage) {
	const sub = redis.createClient({
		password: redis_pass
	});
	sub.on('message', onMessage);
	sub.subscribe(channel);
	return sub;
}