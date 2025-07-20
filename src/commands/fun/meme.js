const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("meme")
		.setDescription("Te muestra un meme de programación 😎"),
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const res = await fetch("https://meme-api.com/gimme/ProgrammerHumor");
			const data = await res.json();

			const { title, url, postLink, author } = data;

			const embed = new EmbedBuilder()
				.setTitle(title)
				.setURL(postLink)
				.setImage(url)
				.setColor("Random")
				.setFooter({ text: `Autor: u/${author}` });

			await interaction.editReply({ embeds: [embed] });
		} catch (err) {
			console.error("Error obteniendo el meme:", err);
			await interaction.editReply(
				"❌ No se pudo cargar el meme, intenta más tarde.",
			);
		}
	},
};
