const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un miembro del servidor.')
    .addUserOption(option =>
      option.setName('usuario')
    .setDescription('El miembro que quieres banear.')
    .setRequired(true))
    .addStringOption(option =>
      option.setName('razón')
    .setDescription('La razón para el baneo.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('razón') || 'No se proporcionó una razón.';

    if (!target) {
      return interaction.reply({ content: 'No pude encontrar a ese usuario.', ephemeral: true });
    }
    if (target.id === interaction.user.id) {
        return interaction.reply({ content: 'No puedes banearte a ti mismo.', ephemeral: true });
    }
    if (!target.bannable) {
      return interaction.reply({ content: 'No puedo banear a este usuario. Puede que tenga un rol más alto que el mío.', ephemeral: true });
    }

    const banEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Usuario Baneado')
      .addFields(
        { name: 'Usuario', value: target.user.tag, inline: true },
        { name: 'Moderador', value: interaction.user.tag, inline: true },
        { name: 'Razón', value: reason }
      )
      .setTimestamp();

    try {
        await target.send(`Has sido baneado del servidor **${interaction.guild.name}** por la siguiente razón: ${reason}`);
    } catch (error) {
        console.log(`No se pudo enviar el MD a ${target.user.tag}.`);
    }
    
    await target.ban({ reason: reason });

    await interaction.reply({ embeds: [banEmbed] });
  },
};