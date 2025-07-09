const { Events } = require("discord.js");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, client) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(
				`No se encontró un comando que coincida con ${interaction.commandName}.`,
			);
			return;
		}

		try {
			await command.execute(interaction, client);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "¡Hubo un error al ejecutar este comando!",
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: "¡Hubo un error al ejecutar este comando!",
					ephemeral: true,
				});
			}
		}
	},
};
