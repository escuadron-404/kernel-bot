const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');
const reposFile = path.join(__dirname, '..', 'repos.json');

module.exports = {
  	data: new SlashCommandBuilder()
		.setName("repos")
		.setDescription("¡Muestra una lista de repositorios guardados!"),
  async execute(interaction) {
    try {
      const data = fs.readFileSync(reposFile, 'utf8');
      const repos = JSON.parse(data);

      if (repos.length === 0) {
        return interaction.reply('📭 No hay repositorios guardados aún.');
      }

      // Discord embed friendly list
      const list = repos.map((url, i) => `${i + 1}. ${url}`).join('\n');
      await interaction.reply(`📚 **Repositorios guardados:**\n${list}`);
    } catch (err) {
      console.error('Error leyendo repos.json:', err);
      await interaction.reply('❌ No se pudo leer la lista de repos.');
    }
  }
};
