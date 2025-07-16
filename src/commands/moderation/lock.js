const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    InteractionContextType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Gestiona el bloqueo de un canal de texto.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setContexts(InteractionContextType.Guild)
        .addSubcommand(subcommand =>
            subcommand
            .setName('on')
            .setDescription('Bloquea un canal para que @everyone no pueda enviar mensajes.')
            .addChannelOption(option =>
                option.setName('canal')
                .setDescription('El canal a bloquear (por defecto, el actual).')
                .addChannelTypes(ChannelType.GuildText))
            .addStringOption(option =>
                option.setName('razón')
                .setDescription('Razón del bloqueo.')))
        .addSubcommand(subcommand =>
            subcommand
            .setName('off')
            .setDescription('Desbloquea un canal.')
            .addChannelOption(option =>
                option.setName('canal')
                .setDescription('El canal a desbloquear (por defecto, el actual).')
                .addChannelTypes(ChannelType.GuildText))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razón') || 'No se especificó una razón.';

        if (subcommand === 'on') {
            await channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false,
            });

            const lockEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔒 Canal Bloqueado')
                .setDescription(`El canal ${channel} ha sido bloqueado.`)
                .addFields({ name: 'Razón', value: reason })
                .setTimestamp();

            await interaction.reply({ embeds: [lockEmbed] });

        } else if (subcommand === 'off') {
            await channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: null, // Restaura el permiso por defecto
            });

            const unlockEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔓 Canal Desbloqueado')
                .setDescription(`El canal ${channel} ha sido desbloqueado y ahora permite enviar mensajes.`)
                .setTimestamp();

            await interaction.reply({ embeds: [unlockEmbed] });
        }
    },
};