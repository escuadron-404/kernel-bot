const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');
const reposFile = path.join(__dirname, '..', '..', '..', 'data', 'repos.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("repodelete")
		.setDescription("Elimina un repositorio por URL o ID")
		.addStringOption(option =>
			option.setName("url")
				.setDescription("La URL del repositorio a eliminar")
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName("id")
				.setDescription("El ID del repositorio a eliminar")
				.setRequired(false)
		),

	async execute(interaction) {
		const url = interaction.options.getString('url');
		const id = interaction.options.getInteger('id');

		if (!url && !id) {
			return interaction.reply({
				content: '⚠️ Debes proporcionar al menos una URL o un ID.',
				ephemeral: true
			});
		}

		let repos = [];
		try {
			const data = fs.readFileSync(reposFile, 'utf8');
			repos = JSON.parse(data);
		} catch (err) {
			console.error('Error leyendo repos.json:', err);
			return interaction.reply('❌ No se pudo leer la lista de repositorios.');
		}

		// Encontrar el repo a eliminar
		let toDelete;
		if (id) {
			toDelete = repos.find(r => r.id === id);
		} else if (url) {
			toDelete = repos.find(r => r.url === url);
		}

		if (!toDelete) {
			return interaction.reply({
				content: `❌ No se encontró ningún repositorio con ${id ? `ID \`${id}\`` : `URL \`${url}\``}.`,
				ephemeral: true
			});
		}

		// filtrar fuera el repo
		const updatedRepos = repos.filter(r => r !== toDelete);

		try {
			fs.writeFileSync(reposFile, JSON.stringify(updatedRepos, null, 2));
			await interaction.reply(`🗑️ Repositorio eliminado:\n\`${toDelete.id}.\` [${toDelete.categoria}] ${toDelete.url}`);
		} catch (err) {
			console.error('Error guardando repos.json:', err);
			await interaction.reply('❌ No se pudo eliminar el repositorio.');
		}
	}
};
