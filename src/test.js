// import ws from 'ws';
// const wss = new ws.Server({
// 	port: 8080
// });

// wss.on('connection', conn => {
// 	console.log('got connection', conn);
// 	setInterval(() => {
// 		conn.send('heyoo');
// 	}, 3000);
// });

class Something {
	constructor() {
		this.a = 'a';
	}
}

Something.prototype.someMethod = async function() {

}

function getval() {
	return new Promise(resolve => {
		setTimeout(() => resolve('llll'), 1000);
	});
}

new Something().someMethod();