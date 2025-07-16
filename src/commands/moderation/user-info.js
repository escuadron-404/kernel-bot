const {
	SlashCommandBuilder,
	EmbedBuilder,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user-info")
		.setDescription(
			"Muestra información detallada sobre un miembro del servidor.",
		)
		.setContexts(InteractionContextType.Guild)
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription(
					"El miembro del que quieres ver la info (por defecto, tú mismo).",
				),
		),

	async execute(interaction) {
		const member =
			interaction.options.getMember("usuario") || interaction.member;

		const roles = member.roles.cache
			.sort((a, b) => b.position - a.position)
			.map((role) => role.toString())
			.slice(0, -1);

		const userInfoEmbed = new EmbedBuilder()
			.setColor(member.displayHexColor || "#99aab5")
			.setTitle(`Información de ${member.user.username}`)
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
			.addFields(
				{ name: "👤 Tag", value: `\`${member.user.tag}\``, inline: true },
				{ name: "🆔 ID", value: `\`${member.id}\``, inline: true },
				{ name: "Nickname", value: member.nickname || "Ninguno", inline: true },
				{
					name: "🤖 ¿Es un bot?",
					value: member.user.bot ? "Sí" : "No",
					inline: true,
				},
				{
					name: "📅 Cuenta Creada",
					value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`,
				},
				{
					name: "📥 Se Unió al Servidor",
					value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
				},
				{
					name: `🎭 Roles (${roles.length})`,
					value: roles.length > 0 ? roles.join(", ") : "Ningún rol",
				},
			)
			.setTimestamp();

		await interaction.reply({ embeds: [userInfoEmbed] });
	},
};
