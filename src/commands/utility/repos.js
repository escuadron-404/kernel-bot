const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const reposFile = path.join(__dirname, "..", "..", "..", ".data", "repos.json");

const categorias = {
	1: "frontend",
	2: "backend",
	3: "fullstack",
	4: "bot",
	5: "api",
	6: "cli",
	7: "ai",
	8: "web",
	9: "tools",
	10: "testing",
	11: "cloud",
	12: "security",
	13: "devops",
	14: "mobile",
	15: "games",
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("repos")
		.setDescription("¡Muestra una lista de repositorios guardados!")
		.addIntegerOption((option) =>
			option
				.setName("categoria")
				.setDescription("Filtra por categoría")
				.setRequired(false)
				.addChoices(
					...Object.entries(categorias).map(([value, name]) => ({
						name,
						value: parseInt(value),
					})),
				),
		)
		.addIntegerOption((option) =>
			option
				.setName("id")
				.setDescription("Busca un repositorio por ID")
				.setRequired(false),
		),

	async execute(interaction) {
		try {
			const data = fs.readFileSync(reposFile, "utf8");
			let repos = JSON.parse(data);

			if (repos.length === 0) {
				return interaction.reply("📭 No hay repositorios guardados aún.");
			}

			const idValue = interaction.options.getInteger("id");
			const categoriaValue = interaction.options.getInteger("categoria");

			// Buscar por ID si se proporcionó
			if (idValue) {
				const found = repos.find((repo) => repo.id === idValue);
				if (!found) {
					return interaction.reply(
						`❌ No se encontró un repositorio con ID \`${idValue}\`.`,
					);
				}
				return interaction.reply(
					`🔍 **Repositorio encontrado:**\n\`${found.id}.\` [${found.categoria}] ${found.url}`,
				);
			}

			// Si no hay ID, filtrar por categoría (si aplica)
			let categoriaName;
			if (categoriaValue) {
				categoriaName = categorias[categoriaValue];
				repos = repos.filter((repo) => repo.categoria === categoriaName);
				if (repos.length === 0) {
					return interaction.reply(
						`📭 No hay repos para la categoría **${categoriaName}**.`,
					);
				}
			}

			const pageSize = 1;
			let page = 0;

			const getPage = (page) => {
				const start = page * pageSize;
				const end = start + pageSize;
				return repos
					.slice(start, end)
					.map((repo) => `\`${repo.id}.\` [${repo.categoria}] ${repo.url}`)
					.join("\n");
			};

			const totalPages = Math.ceil(repos.length / pageSize);

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("prev")
					.setLabel("⬅️ Anterior")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("Siguiente ➡️")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(totalPages <= 1),
			);

			const message = await interaction.reply({
				content: `📚 **Repositorios guardados**${categoriaName ? ` (categoría: ${categoriaName})` : ""}:\n\n${getPage(page)}`,
				components: [row],
				ephemeral: false,
				fetchReply: true,
			});

			const collector = message.createMessageComponentCollector({
				idle: 30_000,
			});

			collector.on("collect", async (i) => {
				if (i.user.id !== interaction.user.id) {
					return i.reply({
						content: "⛔ No puedes usar estos botones.",
						ephemeral: true,
					});
				}
				if (i.customId === "next") {
					page++;
				}
				if (i.customId === "prev") {
					page--;
				}

				row.components[0].setDisabled(page === 0);
				row.components[1].setDisabled(page >= totalPages - 1);

				await i.update({
					content: `📚 **Repositorios guardados**${categoriaName ? ` (categoría: ${categoriaName})` : ""}:\n\n${getPage(page)}`,
					components: [row],
				});
			});

			collector.on("end", () => {
				row.components.forEach((button) => button.setDisabled(true));
				message.edit({ components: [row] }).catch((err) => {
					console.warn("No se pudo editar el mensaje:", err.message);
				});
			});
		} catch (err) {
			console.error("Error leyendo repos.json:", err);
			await interaction.reply("❌ No se pudo leer la lista de repos.");
		}
	},
};
