export default function extend(DiscordClient) {
	DiscordClient.defineCommand('spam', (msg, args) => {

		let [messageToSend, intervalInMsec, cancelAfter] = args;

		intervalInMsec *= 1000;
		cancelAfter *= 1000;

		let interval = setInterval( () => {
			msg.channel.sendMessage(messageToSend);
		}, intervalInMsec);

		if(cancelAfter > 0) setTimeout( () => clearInterval(interval), cancelAfter);

	}, {requiredParams: 3, usage: '!spam <message> <interval> <timeout>', cost: 200});
}