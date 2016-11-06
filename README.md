# discord_bot

A personal currency Discord bot written in `discord.js`.

<h3>Development</h3>

1. Clone the repository
2. Run `sudo npm install` to fetch all required dependencies
3. Run `npm run init` 
4. Go into `build/bot_config.json`, and make it an object populated with the following keys:
	- `bot_token`: a token for your bot
	- `redis_pass`: (OPTIONAL), the password for your Redis server
	- `steam_api_key`: (OPTIONAL), only if you wish to use the Steam commands
5. Run `npm run compiler` to run a compiler
6. Run `npm run start` to start the bot, which restars when you change a file in the `src` dir
