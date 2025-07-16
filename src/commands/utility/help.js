// src/commands/utilidad/help.js
const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	InteractionContextType,
} = require("discord.js");

module.exports = {
	category: "utility",
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription(
			"Muestra la lista de comandos disponibles y su descripción.",
		)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

	async execute(interaction) {
		const { commands } = interaction.client;
		const categories = {};

		commands.forEach((cmd) => {
			if (!cmd.category || cmd.category === "owner") {
				return;
			}
			if (!categories[cmd.category]) {
				categories[cmd.category] = {
					label: cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1),
					emoji: "⚙",
					commands: [],
				};
			}
			categories[cmd.category].commands.push(cmd.data);
		});

		if (categories["moderacion"]) {
			categories["moderacion"].emoji = "🛡";
		}
		if (categories["canal"]) {
			categories["canal"].emoji = "#";
		}
		if (categories["utilidad"]) {
			categories["utilidad"].emoji = "i";
		}

		const homeEmbed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle("Centro de Ayuda")
			.setDescription(
				"Usa el menú desplegable para explorar los comandos por categoría.",
			)
			.setTimestamp();

		const selectMenuOptions = Object.keys(categories).map((key) => ({
			label: categories[key].label,
			value: key,
			emoji: categories[key].emoji,
		}));

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("help_menu")
			.setPlaceholder("Selecciona una categoría...")
			.addOptions(selectMenuOptions);

		const row = new ActionRowBuilder().addComponents(selectMenu);

		const message = await interaction.reply({
			embeds: [homeEmbed],
			components: [row],
			ephemeral: true,
		});

		const collector = message.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id,
			time: 120000,
		});

		collector.on("collect", async (i) => {
			const categoryKey = i.values[0];
			const category = categories[categoryKey];

			const categoryEmbed = new EmbedBuilder()
				.setColor(0x5865f2)
				.setTitle(`${category.emoji} Comandos de ${category.label}`)
				.setFields(
					category.commands.map((cmd) => ({
						name: `\`/${cmd.name}\``,
						value: cmd.description,
					})),
				)
				.setTimestamp();

			await i.update({ embeds: [categoryEmbed] });
		});

		collector.on("end", () =>
			interaction.editReply({ components: [] }).catch((error) => {
				console.log(`Problema terminando la recolección de ayudaÑ ${error}`);
			}),
		);
	},
};
