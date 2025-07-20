const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Muestra el avatar del usuario, (por defecto el tuyo)")
		.addMentionableOption((option) =>
			option
				.setName("user")
				.setDescription("Usuario del que quieres mostrar su avatar")
				.setRequired(false),
		)
		.addBooleanOption((option) =>
			option
				.setName("guild")
				.setDescription("¿Mostrar el avatar del servidor?")
				.setRequired(false),
		),
	async execute(interaction) {
		const user = interaction.options.getMentionable("user") || interaction.user;
		const showGuildAvatar = interaction.options.getBoolean("guild");
		const member = await interaction.guild.members.fetch(user.id);
		const avatarURL = showGuildAvatar
			? member.displayAvatarURL({ dynamic: true })
			: user.displayAvatarURL({ dynamic: true });
		try {
			await interaction.reply({ content: `${avatarURL}` });
		} catch (err) {
			console.error("Error obteniendo el avatar del usuario", err);
			await interaction.reply(
				"❌ No se pudo obtener el avatar del usuario especificado",
			);
		}
	},
};
