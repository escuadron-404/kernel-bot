const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Expulsa a un miembro del servidor.")
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription("El miembro que quieres expulsar.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("razón").setDescription("La razón para la expulsión."),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		const target = interaction.options.getMember("usuario");
		const reason =
			interaction.options.getString("razón") || "No se proporcionó una razón.";

		if (!target) {
			return interaction.reply({
				content: "No pude encontrar a ese usuario.",
				ephemeral: true,
			});
		}
		if (target.id === interaction.user.id) {
			return interaction.reply({
				content: "No puedes expulsarte a ti mismo.",
				ephemeral: true,
			});
		}
		if (!target.kickable) {
			return interaction.reply({
				content:
					"No puedo expulsar a este usuario. Puede que tenga un rol más alto que el mío.",
				ephemeral: true,
			});
		}

		const kickEmbed = new EmbedBuilder()
			.setColor(0xff8c00)
			.setTitle("Usuario Expulsado")
			.addFields(
				{ name: "Usuario", value: target.user.tag, inline: true },
				{ name: "Moderador", value: interaction.user.tag, inline: true },
				{ name: "Razón", value: reason },
			)
			.setTimestamp();

		try {
			await target.send(
				`Has sido expulsado del servidor **${interaction.guild.name}** por la siguiente razón: ${reason}`,
			);
		} catch (error) {
			console.log(
				`No se pudo enviar el MD a ${target.user.tag}. Error: ${error}`,
			);
		}

		await target.kick(reason);

		await interaction.reply({ embeds: [kickEmbed] });
	},
};
