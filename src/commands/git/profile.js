const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Este comando aún está en construcción."),

	async execute(interaction) {
		await interaction.reply({
			content: "Este comando aún no está implementado.",
			ephemeral: true,
		});
	},
};
