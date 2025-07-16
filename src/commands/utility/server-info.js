const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType,
    GuildVerificationLevel,
    InteractionContextType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Muestra información y estadísticas detalladas sobre este servidor.')
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const verificationLevels = {
            [GuildVerificationLevel.None]: 'Ninguno',
            [GuildVerificationLevel.Low]: 'Bajo',
            [GuildVerificationLevel.Medium]: 'Medio',
            [GuildVerificationLevel.High]: 'Alto',
            [GuildVerificationLevel.VeryHigh]: 'Muy Alto'
        };

        const serverInfoEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Información de ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Propietario', value: owner.user.tag, inline: true },
                { name: '🆔 ID del Servidor', value: `\`${guild.id}\``, inline: true },
                { name: '📅 Creación', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>` },
                {
                    name: `👥 Miembros (${guild.memberCount})`,
                    value: `**${guild.members.cache.filter(m => !m.user.bot).size}** Humanos | **${guild.members.cache.filter(m => m.user.bot).size}** Bots`,
                    inline: true
                },
                {
                    name: `💬 Canales (${guild.channels.cache.size})`,
                    value: `**${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}** Texto | **${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}** Voz`,
                    inline: true
                },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '✨ Nivel de Verificación', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: '🚀 Boosts', value: `Nivel **${guild.premiumTier}** con **${guild.premiumSubscriptionCount}** boosts`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [serverInfoEmbed] });
    },
};