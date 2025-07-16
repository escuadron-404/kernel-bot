const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("nickname")
		.setDescription("Cambia o resetea el apodo de un miembro.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
		.setContexts(InteractionContextType.Guild)
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription("El miembro cuyo apodo quieres cambiar.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("nuevo_apodo")
				.setDescription("El nuevo apodo. Déjalo en blanco para resetearlo.")
				.setMaxLength(32),
		),

	async execute(interaction) {
		const target = interaction.options.getMember("usuario");
		const newNickname = interaction.options.getString("nuevo_apodo") || null;

		if (!target) {
			return interaction.reply({
				content: "❌ No pude encontrar a ese usuario.",
				ephemeral: true,
			});
		}
		if (!target.manageable) {
			return interaction.reply({
				content:
					"❌ No puedo cambiar el apodo de este usuario. Puede que tenga un rol superior al mío.",
				ephemeral: true,
			});
		}
		if (
			interaction.member.roles.highest.position <= target.roles.highest.position
		) {
			return interaction.reply({
				content:
					"❌ No puedes cambiar el apodo de un miembro con un rol igual o superior al tuyo.",
				ephemeral: true,
			});
		}

		try {
			const oldNickname = target.displayName;
			await target.setNickname(
				newNickname,
				`Cambiado por ${interaction.user.tag}`,
			);

			const nicknameEmbed = new EmbedBuilder()
				.setColor(0x7289da)
				.setTitle("📝 Apodo Actualizado")
				.setDescription(
					newNickname
						? `El apodo de **${oldNickname}** ha sido cambiado a **${newNickname}**.`
						: `El apodo de **${oldNickname}** ha sido reseteado.`,
				)
				.addFields(
					{ name: "Usuario", value: target.toString(), inline: true },
					{
						name: "Moderador",
						value: interaction.user.toString(),
						inline: true,
					},
				)
				.setTimestamp();

			await interaction.reply({ embeds: [nicknameEmbed] });
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: "❌ Hubo un error al intentar cambiar el apodo.",
				ephemeral: true,
			});
		}
	},
};
