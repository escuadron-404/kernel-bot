const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Crea una encuesta simple en el canal.')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('La pregunta que quieres hacer en la encuesta.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('pregunta');

    const pollEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 Encuesta: ${question}`)
      .setDescription('Reacciona con 👍 o 👎 para votar.')
      .setTimestamp()
      .setFooter({ text: `Encuesta iniciada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    try {
      const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });

      await pollMessage.react('👍');
      await pollMessage.react('👎');
      
    } catch (error) {
      console.error('Error al crear la encuesta:', error);
      await interaction.reply({ content: 'Hubo un error al intentar crear la encuesta.', ephemeral: true });
    }
  },
};