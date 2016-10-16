import db from './database';
import CVL, {constructLeaderboard as CL} from '../leaderboard';

function all() {
	let proms = new Array();

	for(let prop in this) {
		if(this.hasOwnProperty(prop) && typeof this[prop] === 'function' && prop !== 'all') {
			proms.push(this[prop]());
		}
	}

	return Promise.all(proms);
}

export const pubLeaderboard = {
	visual(channel = 'leaderboard_visual') {
		return CVL().then(leaderboard => db.publishAsync(channel, leaderboard));
	},

	json(channel = 'leaderboard_json') {
		return CL().then(leaderboard => db.publishAsync(channel, JSON.stringify(leaderboard)));
	},

	all //runs all of the publisher functions in the object, and returns a promise that resolves when all are finished
}