const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	ChannelType,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("slowmode")
		.setDescription("Establece o elimina el modo lento en un canal.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts(InteractionContextType.Guild)
		.addIntegerOption((option) =>
			option
				.setName("segundos")
				.setDescription(
					"Tiempo en segundos entre mensajes (0 para desactivar). Límite: 6 horas (21600s).",
				)
				.setMinValue(0)
				.setMaxValue(21600)
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName("canal")
				.setDescription(
					"El canal donde aplicar el modo lento (por defecto, el actual).",
				)
				.addChannelTypes(ChannelType.GuildText),
		),

	async execute(interaction) {
		const seconds = interaction.options.getInteger("segundos");
		const channel =
			interaction.options.getChannel("canal") || interaction.channel;

		try {
			await channel.setRateLimitPerUser(
				seconds,
				`Modo lento gestionado por ${interaction.user.tag}`,
			);

			const slowmodeEmbed = new EmbedBuilder()
				.setColor(seconds > 0 ? 0xffa500 : 0x00ff00)
				.setTitle(
					seconds > 0 ? "⏳ Modo Lento Activado" : "✅ Modo Lento Desactivado",
				)
				.setDescription(
					`El modo lento en ${channel} ha sido ${seconds > 0 ? `establecido en **${seconds} segundos**` : "**desactivado**"}.`,
				)
				.setTimestamp();

			await interaction.reply({ embeds: [slowmodeEmbed] });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content:
					"❌ Hubo un error al intentar establecer el modo lento. Revisa mis permisos sobre ese canal.",
				ephemeral: true,
			});
		}
	},
};
