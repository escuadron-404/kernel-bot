const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unban")
		.setDescription("Revoca el baneo de un usuario.")
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild)
		.addStringOption((option) =>
			option
				.setName("id_usuario")
				.setDescription(
					"La ID del usuario que quieres desbanear. No puedes usar una @mención.",
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("razón").setDescription("La razón para el desbaneo."),
		),

	async execute(interaction) {
		const userId = interaction.options.getString("id_usuario");
		const reason =
			interaction.options.getString("razón") || "No se proporcionó una razón.";

		try {
			const bannedUser = await interaction.client.users.fetch(userId);

			await interaction.guild.members.unban(bannedUser, reason);

			const unbanEmbed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle("🟢 Usuario Desbaneado")
				.setThumbnail(bannedUser.displayAvatarURL({ dynamic: true }))
				.addFields(
					{ name: "Usuario", value: bannedUser.tag, inline: true },
					{ name: "Moderador", value: interaction.user.tag, inline: true },
					{ name: "Razón", value: reason },
				)
				.setTimestamp();

			await interaction.reply({ embeds: [unbanEmbed] });
		} catch (error) {
			console.error(error);
			let errorMessage =
				"❌ Ocurrió un error al intentar desbanear al usuario.";
			if (error.code === 10013 || error.code === 10026) {
				errorMessage =
					"❌ No se pudo encontrar al usuario o no está baneado. Asegúrate de que la ID sea correcta.";
			}
			await interaction.reply({ content: errorMessage, ephemeral: true });
		}
	},
};
