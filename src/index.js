require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = new Collection();

const handlersPath = path.join(__dirname, "handlers");
const handlerFiles = fs
	.readdirSync(handlersPath)
	.filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
	const filePath = path.join(handlersPath, file);
	require(filePath)(client);
}

client.login(process.env.DISCORD_TOKEN);
