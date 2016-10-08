import fetch from 'node-fetch';

export default function extend(DiscordClient) {
	DiscordClient.defineCommand('spam', (msg, args) => {

		let [messageToSend, intervalInMsec, cancelAfter] = args;

		intervalInMsec *= 1000;
		cancelAfter *= 1000;

		let interval = setInterval( () => {
			msg.channel.sendMessage(messageToSend);
		}, intervalInMsec);

		if(cancelAfter > 0) setTimeout( () => clearInterval(interval), cancelAfter);

	}, {requiredParams: 3, usage: '!spam <message> <interval> <timeout>', buyPrice: 3500});

	DiscordClient.defineCommand('test', msg => {
		console.log('!!');
	}, {exec_cost: 50});

	DiscordClient.on('message', msg => {
			//transform subreddits into actual links
			const {content, author} = msg;

			if(author !== DiscordClient.user) {
				let regex = /(r\/|\/r\/)\w+/g;

				let match = content.match(regex);

				if(match) {
					match.forEach(str => {
						let subName = str.substring(str.startsWith('/') ? 3 : 2),
							aboutUrl = `https://www.reddit.com/r/${subName}/about.json`;

						fetch(aboutUrl).then(res => {
							if((res.ok || res.status === 403) && res.url === aboutUrl)  {
								//request was successfull and the subreddit exists
								//403 is returned if a subreddit is forbidden
								return msg.reply(`You linked a subreddit: https://reddit.com/r/${subName} .`);

							} else {
								//network error or sub doesn't exist
								return msg.reply(`Subreddit: ${subName} doesn't exist.`);
							}
						}).catch(console.error);
					});
				}
			}

	});
}