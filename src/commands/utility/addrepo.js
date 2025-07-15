const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');
const reposFile = path.join(__dirname, '..', 'repos.json');

module.exports = {
  	data: new SlashCommandBuilder()
		.setName("addrepo")
		.setDescription("¡Añade un repositorio a la lista!")
        .addStringOption((option) =>
			option
				.setName("url")
				.setDescription("La url del repositorio")
				.setRequired(true),
		),
  async execute(interaction) {
    const url = interaction.options.getString('url');

    // es una url?
    if (!url.startsWith('http')) {
      return interaction.reply({ content: '❌ URL inválida.', ephemeral: true });
    }

    let repos = [];
    try {
      const data = fs.readFileSync(reposFile, 'utf8');
      repos = JSON.parse(data);
    } catch (err) {
      console.error('Error leyendo repos.json:', err);
    }

    // agregar si no existe
    if (repos.includes(url)) {
      return interaction.reply({ content: '⚠️ Ese repo ya está guardado.', ephemeral: true });
    }

    repos.push(url);

    // guardar en repos.json
    try {
      fs.writeFileSync(reposFile, JSON.stringify(repos, null, 2));
      await interaction.reply(`✅ Repositorio guardado:\n${url}`);
    } catch (err) {
      console.error('Error guardando repos.json:', err);
      await interaction.reply('❌ No se pudo guardar el repositorio.');
    }
  }
};
