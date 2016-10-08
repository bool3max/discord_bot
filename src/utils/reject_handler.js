export default function reject_handler(opts) {
	if(opts.u && opts.msg) opts.msg.reply(opts.u).catch(console.error);
	if(opts.d) console.error(opts.d);
}