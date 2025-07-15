const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');
const reposFile = path.join(__dirname, '..', '..', '..', 'data', 'repos.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("repoadd")
		.setDescription("¡Añade un repositorio a la lista!")
		.addStringOption((option) =>
			option
				.setName("url")
				.setDescription("La url del repositorio")
				.setRequired(true),
		).addIntegerOption(option =>
			option.setName('categoria')
				.setDescription('Categoría para el repositorio')
				.setRequired(true)
				.addChoices(
					{ name: 'frontend', value: 1 },
					{ name: 'backend', value: 2 },
					{ name: 'fullstack', value: 3 },
					{ name: 'bot', value: 4 },
					{ name: 'api', value: 5 },
					{ name: 'cli', value: 6 },
					{ name: 'ai', value: 7 },
					{ name: 'web', value: 8 },
					{ name: 'tools', value: 9 },
					{ name: 'testing', value: 10 },
					{ name: 'cloud', value: 11 },
					{ name: 'security', value: 12 },
					{ name: 'devops', value: 13 },
					{ name: 'mobile', value: 14 },
					{ name: 'games', value: 15 }
				)
		),

	async execute(interaction) {
		const url = interaction.options.getString('url');
		const categoriaValue = interaction.options.getInteger('categoria');

		if (!url.startsWith('https://github.com')) {
			return interaction.reply({ content: '❌ URL inválida.', ephemeral: true });
		}

		let repos = [];
		try {
			const data = fs.readFileSync(reposFile, 'utf8');
			repos = JSON.parse(data);
		} catch (err) {
			console.error('Error leyendo repos.json:', err);
		}

		if (repos.some(repo => repo.url === url)) {
			return interaction.reply({ content: '⚠️ Ese repo ya está guardado.', ephemeral: true });
		}

		// Obtener nombre de la categoría
		const categoriaOption = this.data.options.find(option => option.name === 'categoria');
		const selectedChoice = categoriaOption.choices.find(c => c.value === categoriaValue);
		const categoria = selectedChoice.name;

		// Generar el siguiente ID
		const nextId = repos.length > 0 ? Math.max(...repos.map(r => r.id || 0)) + 1 : 1;

		// Agregar el nuevo repo con ID
		repos.push({ id: nextId, url, categoria });

		try {
			const categoryName = categoria.charAt(0).toUpperCase() + categoria.slice(1);
			fs.writeFileSync(reposFile, JSON.stringify(repos, null, 2));
			await interaction.reply(`✅ Repositorio guardado con ID \`${nextId}\` en **${categoryName}**:\n${url}`);
		} catch (err) {
			console.error('Error guardando repos.json:', err);
			await interaction.reply('❌ No se pudo guardar el repositorio.');
		}
	}
};
