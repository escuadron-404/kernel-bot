const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("joke")
		.setDescription("Te cuenta un chiste de programación"),

	async execute(interaction) {
		try {
			const res = await fetch(
				"https://v2.jokeapi.dev/joke/Programming?lang=en&type=single",
			);
			const data = await res.json();

			if (data.error) {
				return interaction.reply(
					"No pude conseguir un chiste ahora, intenta luego.",
				);
			}

			// Para chistes que no son single, puedes manejar setup + delivery, pero aquí solo single
			const joke = data.joke || "No encontré chiste esta vez 😕";

			await interaction.reply(`${joke}`);
		} catch (error) {
			console.error(error);
			await interaction.reply("Algo falló al buscar el chiste.");
		}
	},
};
