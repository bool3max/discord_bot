import CurrencyUser from './CurrencyUser';

export function constructLeaderboard() {
	return CurrencyUser.getAll().then(users => {

		const sortedUsers = users.sort((a, b) => {
			a.bal = parseInt(a.bal); b.bal = parseInt(b.bal);
			if(a.bal > b.bal) return -1;
			if(a.bal < b.bal) return 1;
			return 0;
		});

		return Promise.resolve(sortedUsers);

	});
}

export default function constructVisualLeaderboard() {
	return constructLeaderboard().then(leaderboard => {
		let textLeaderboard = '';

		leaderboard.forEach((user, i) => {
			if(i === 0) {
				textLeaderboard += `**${i + 1}.** :first_place: ${user.username} - **$${user.bal}**\n\n`;
			} else if(i === 1) {
				textLeaderboard += `**${i + 1}.** :second_place: ${user.username} - **$${user.bal}**\n\n`;
			} else if(i === 2) {
				textLeaderboard += `**${i + 1}.** :third_place: ${user.username} - **$${user.bal}**\n\n`;
			} else textLeaderboard += `**${i + 1}.** ${user.username} - **$${user.bal}**\n\n`;
		});	

		return Promise.resolve(textLeaderboard);
	});
}