import redis from 'redis';
import {promisifyAll} from 'bluebird';

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const db = redis.createClient({
	password: 'a45hgf678nopzx48712yy3cc0',
	string_numbers: false
});

export default db;