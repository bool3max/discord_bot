export default function reject_handler(err) {
	if(typeof err !== 'object') {
		return console.error(err);
	}

	if(err.u && err.msg) {
		err.msg.reply(err.u).catch(console.error);
	} 
	if (err.d) {
		console.error(err.d);
	}

	if(!(err.u && err.msg) && !err.d) {
		console.log(err);
	}
}