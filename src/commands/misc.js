import ChatCommand from '../ChatCommand';
import fetch from 'node-fetch';

const cmd_spam = new ChatCommand('spam', (msg, args) => {
	let [messageToSend, intervalInMsec, cancelAfter] = args;

	intervalInMsec *= 1000;
	cancelAfter *= 1000;

	let interval = setInterval( () => {
		msg.channel.sendMessage(messageToSend);
	}, intervalInMsec);

	if(cancelAfter > 0) setTimeout( () => clearInterval(interval), cancelAfter);
}, {
	requiredParams: 3,
	usage: '!spam <message> <interval> <timeout>',
	buyPrice: 3500
});

const cmd_rot13 = new ChatCommand('rot13', (msg, args) => {

	function rot13char(char) {
		const alphabet = 'abcdefghijklmnopqrstuvwxyz';
		if(typeof char !== 'string' || char.length > 1 || char === '') throw new Error('Pass a valid string character.');
		lowChar = char.toLowerCase();
		if(!alphabet.includes(lowChar)) return lowChar;
		let encoded = alphabet.charAt(alphabet.indexOf(lowChar) + 13) !== '' ? alphabet.charAt(alphabet.indexOf(lowChar) + 13) : alphabet.charAt(alphabet.indexOf(lowChar) - 13);
		return char.toUpperCase() === char ? encoded.toUpperCase() : encoded;

	}

	const [msgToEncode] = args;
	if(typeof msgToEncode !== 'string') {
		return msg.reply('Please pass a string.');
	}
	let final = '';
	for(let char of msgToEncode) {
		final += rot13char(char);
	}
	msg.reply(`Here's your string: **${final}**.`).catch(console.error);

}, {
	requiredParams: 1,
	usage: '!rot13decode <msg_to_encode>',
	exec_cost: 20
});

export default [cmd_rot13, cmd_spam];

// DiscordClient.on('message', msg => {
// 		//transform subreddits into actual links
// 		const {content, author} = msg;

// 		if(author !== DiscordClient.user) {
// 			let regex = /(r\/|\/r\/)\w+/g;

// 			let match = content.match(regex);

// 			if(match) {
// 				match.forEach(str => {
// 					let subName = str.substring(str.startsWith('/') ? 3 : 2),
// 						aboutUrl = `https://www.reddit.com/r/${subName}/about.json`;

// 					fetch(aboutUrl).then(res => {
// 						if((res.ok || res.status === 403) && res.url === aboutUrl)  {
// 							//request was successfull and the subreddit exists
// 							//403 is returned if a subreddit is forbidden
// 							return msg.reply(`You linked a subreddit: https://reddit.com/r/${subName} .`);

// 						} else {
// 							//network error or sub doesn't exist
// 							return msg.reply(`Subreddit: ${subName} doesn't exist.`);
// 						}
// 					}).catch(console.error);
// 				});
// 			}
// 		}

// });