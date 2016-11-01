# discord_bot
A simple custom Discord bot written with Discord.js

Development: 

    NOTE: This is requires that you have a local Redis server running on port 6379 (also make sure to change (or remove) the redis auth passowrd in src/database.js)

	Clone the repo

	Run 'sudo npm install' to fetch all dependencies

	Run 'npm run init' to compile the src directory for the first time, and also create a bot_config.json file in ./build

    Go into build/bot_config.json. Make it an object containing 2 properties. `bot_token`, the token for your bot,
	and `steam_api_key`, a string containing your steam api key (only if you wish to use the steam commands)

	From there you can run 'npm run babel' to run a watcher on the src directory (instead of having to use 'npm run init' every single time)

	You can run the bot by running 'npm run bot'

	'npm run bot' is an alias for 'nodemon --watch build', therefore whenever you change a file in the src or build dir, the bot will restart


