const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Borra una cantidad específica de mensajes de este canal.")
		.addIntegerOption((option) =>
			option
				.setName("cantidad")
				.setDescription("El número de mensajes a borrar (entre 1 y 100).")
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute(interaction) {
		const amount = interaction.options.getInteger("cantidad");

		try {
			const messages = await interaction.channel.bulkDelete(amount, true);

			const successEmbed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setDescription(
					`✅ Se han borrado exitosamente **${messages.size}** mensajes.`,
				);

			await interaction.reply({ embeds: [successEmbed], ephemeral: true });
		} catch (error) {
			console.error(error);
			const errorEmbed = new EmbedBuilder()
				.setColor(0xff0000)
				.setDescription(
					"❌ Hubo un error al intentar borrar los mensajes. Es posible que sean más antiguos de 14 días.",
				);
			await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
		}
	},
};
