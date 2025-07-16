const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("warnings")
		.setDescription(
			"Muestra todas las advertencias de un miembro (requiere base de datos).",
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild)
		.addUserOption((option) =>
			option
				.setName("usuario")
				.setDescription("El miembro cuyas advertencias quieres ver.")
				.setRequired(true),
		),

	async execute(interaction) {
		const target = interaction.options.getMember("usuario");

		// --- LÓGICA DE BASE DE DATOS AQUÍ ---
		// 1. Conectar a tu base de datos.
		// 2. Buscar todas las advertencias donde `userId` y `guildId` coincidan.
		// const warnings = await db.warnings.find({ userId: target.id, guildId: interaction.guild.id }).sort({ timestamp: -1 });

		// Ejemplo de datos para demostración (borra esto cuando implementes tu BD)
		const warnings = [
			{
				moderatorId: "ID_DEL_MOD_1",
				reason: "Spam en el canal general.",
				timestamp: Date.now() - 86400000 * 5,
			},
			{
				moderatorId: "ID_DEL_MOD_2",
				reason: "Uso excesivo de mayúsculas.",
				timestamp: Date.now() - 86400000 * 2,
			},
			{
				moderatorId: "ID_DEL_MOD_1",
				reason: "Comportamiento disruptivo en canal de voz.",
				timestamp: Date.now(),
			},
		];

		if (!warnings || warnings.length === 0) {
			return interaction.reply({
				content: `✅ El usuario ${target.user.tag} no tiene ninguna advertencia.`,
				ephemeral: true,
			});
		}

		const warningsEmbed = new EmbedBuilder()
			.setColor(0xffff00)
			.setTitle(`📜 Historial de Advertencias de ${target.user.tag}`)
			.setDescription(`Se encontraron **${warnings.length}** advertencia(s).`)
			.setThumbnail(target.user.displayAvatarURL({ dynamic: true }));

		for (const warn of warnings) {
			const moderator = await interaction.client.users
				.fetch(warn.moderatorId)
				.catch(() => ({ tag: "Moderador Desconocido" }));
			warningsEmbed.addFields({
				name: `🗓️ ${new Date(warn.timestamp).toLocaleDateString()}`,
				value: `**Razón:** ${warn.reason}\n**Moderador:** \`${moderator.tag}\``,
			});
		}

		await interaction.reply({ embeds: [warningsEmbed], ephemeral: true });
	},
};
