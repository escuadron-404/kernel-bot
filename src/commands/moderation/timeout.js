const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
} = require("discord.js");
const ms = require("ms");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("timeout")
		.setDescription("Aplica un timeout a un miembro, impidiéndole interactuar.")
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription("El miembro al que aplicar el timeout.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("duración")
				.setDescription("La duración del timeout (ej: 10m, 1h, 1d).")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("razón").setDescription("La razón para el timeout."),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute(interaction) {
		const target = interaction.options.getMember("usuario");
		const durationStr = interaction.options.getString("duración");
		const reason =
			interaction.options.getString("razón") || "No se proporcionó una razón.";

		const durationMs = ms(durationStr);

		if (!target) {
			return interaction.reply({
				content: "No pude encontrar a ese usuario.",
				ephemeral: true,
			});
		}
		if (target.id === interaction.user.id) {
			return interaction.reply({
				content: "No puedes aplicarte un timeout a ti mismo.",
				ephemeral: true,
			});
		}
		if (!durationMs) {
			return interaction.reply({
				content: "Por favor, proporciona una duración válida (ej: 5m, 2h, 3d).",
				ephemeral: true,
			});
		}
		if (!target.moderatable) {
			return interaction.reply({
				content:
					"No puedo aplicar un timeout a este usuario. Puede que tenga un rol más alto que el mío.",
				ephemeral: true,
			});
		}

		await target.timeout(durationMs, reason);

		const timeoutEmbed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle("Usuario en Timeout")
			.addFields(
				{ name: "Usuario", value: target.user.tag, inline: true },
				{ name: "Moderador", value: interaction.user.tag, inline: true },
				{ name: "Duración", value: durationStr, inline: true },
				{ name: "Razón", value: reason },
			)
			.setTimestamp();

		await interaction.reply({ embeds: [timeoutEmbed] });
	},
};
