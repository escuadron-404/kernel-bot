const { SlashCommandBuilder } = require("discord.js");

const respuestas = [
	"Es seguro.",
	"Sin duda.",
	"Puedes confiar en ello.",
	"Sí, definitivamente.",
	"Según veo, sí.",
	"Muy probable.",
	"La perspectiva es buena.",
	"Las señales apuntan a que sí.",
	"Respuesta confusa, intenta de nuevo.",
	"Pregunta más tarde.",
	"Mejor no decirte ahora.",
	"No puedo predecir ahora.",
	"No cuentes con ello.",
	"Mi respuesta es no.",
	"Mis fuentes dicen que no.",
	"La perspectiva no es buena.",
	"Muy dudoso.",
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName("8ball")
		.setDescription("Pregunta a la bola 8 mágica")
		.addStringOption((option) =>
			option
				.setName("pregunta")
				.setDescription("Tu pregunta")
				.setRequired(true),
		),

	async execute(interaction) {
		const pregunta = interaction.options.getString("pregunta", true);
		const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

		await interaction.reply(
			`🎱 Preguntaste: **${pregunta}**\nRespuesta: **${respuesta}**`,
		);
	},
};
