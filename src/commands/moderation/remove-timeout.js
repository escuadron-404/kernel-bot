const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("remove-timeout")
		.setDescription("Levanta el silencio (timeout) de un miembro.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild)
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription("El miembro al que quieres quitar el silencio.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("razón")
				.setDescription("La razón para levantar el silencio."),
		),

	async execute(interaction) {
		const target = interaction.options.getMember("usuario");
		const reason =
			interaction.options.getString("razón") ||
			"El moderador decidió levantar el silencio.";

		if (!target) {
			return interaction.reply({
				content: "❌ No pude encontrar a ese usuario en el servidor.",
				ephemeral: true,
			});
		}
		if (!target.isCommunicationDisabled()) {
			return interaction.reply({
				content: "❌ Este usuario no se encuentra silenciado.",
				ephemeral: true,
			});
		}

		try {
			await target.timeout(null, reason);

			const removeTimeoutEmbed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle("🟢 Silencio Levantado")
				.setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
				.addFields(
					{ name: "Usuario", value: target.user.tag, inline: true },
					{ name: "Moderador", value: interaction.user.tag, inline: true },
					{ name: "Razón", value: reason },
				)
				.setTimestamp();

			await interaction.reply({ embeds: [removeTimeoutEmbed] });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: "❌ Hubo un error al intentar levantar el silencio.",
				ephemeral: true,
			});
		}
	},
};
