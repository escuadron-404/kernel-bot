require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

// Make sure process.env.DISCORD_CLIENT_ID is set in your .env or secrets
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // If deploying guild-specific commands

if (!CLIENT_ID) {
	console.error("CLIENT_ID is not set. Cannot deploy commands.");
	process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, "..", "src/commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ("data" in command && "execute" in command) {
			commands.push(command.data.toJSON());
		} else {
			console.warn(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`,
		);

		let data;
		if (GUILD_ID) {
			// Guild-specific commands (faster to update)
			console.log(`Deploying to guild ${GUILD_ID}`);
			data = await rest.put(
				Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
				{ body: commands },
			);
		} else {
			// Global commands (takes up to an hour to propagate)
			console.log(
				"Deploying global commands. This may take up to an hour to propagate.",
			);
			data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
				body: commands,
			});
		}

		console.log(
			`Successfully reloaded ${data.length} application (/) commands.`,
		);
	} catch (error) {
		console.error("Error deploying commands:", error);
		process.exit(1);
	}
})();
