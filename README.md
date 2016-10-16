# discord_bot
A simple custom Discord bot written with Discord.js

Development: 

    NOTE: This is requires that you have a local Redis server running on port 6379 (also make sure to change (or remove) the redis auth passowrd in src/database.js)

	Clone the repo

	Run 'sudo npm install' to fetch all dependencies

	Run 'npm run init' to compile the src directory for the first time

	In ./build create a file called bot_config.json. Make it an object containing 2 properties. `bot_token`, the token for your bot,
	and `wss_port`, an integer of the port for the websocket server (only necessary if you wish to use the wss)

	From there you can run 'npm run babel' to run a watcher on the src directory (instead of having to use 'npm run init' every single time)

	You can run the bot by running 'npm run bot'

	'npm run bot' is an alias for 'nodemon --watch build', therefore whenever you change a file in the src or build dir, the bot will restart


