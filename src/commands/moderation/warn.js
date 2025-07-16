const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    InteractionContextType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Añade una advertencia a un miembro (requiere base de datos).')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option.setName('usuario')
            .setDescription('El miembro al que quieres advertir.')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('razón')
            .setDescription('La razón de la advertencia.')
            .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razón');

        if (!target) {
            return interaction.reply({ content: '❌ No pude encontrar a ese usuario en el servidor.', ephemeral: true });
        }
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', ephemeral: true });
        }
        if (target.user.bot) {
            return interaction.reply({ content: '❌ No puedes advertir a un bot.', ephemeral: true });
        }
        if (interaction.member.roles.highest.position <= target.roles.highest.position) {
            return interaction.reply({ content: '❌ No puedes advertir a un miembro con un rol igual o superior al tuyo.', ephemeral: true });
        }

        // --- LÓGICA DE BASE DE DATOS AQUÍ ---
        // 1. Conectar a tu base de datos.
        // 2. Guardar la nueva advertencia: { userId: target.id, guildId: interaction.guild.id, moderatorId: interaction.user.id, reason: reason, timestamp: Date.now() }
        // 3. Obtener el número total de advertencias del usuario en este servidor.
        // const totalWarnings = await db.warnings.count({ userId: target.id, guildId: interaction.guild.id });
        const totalWarnings = 'X (desde la BD)'; // Valor de ejemplo para la respuesta visual

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('Has recibido una advertencia')
            .setDescription(`Has recibido una advertencia en el servidor **${interaction.guild.name}**.`)
            .addFields(
                { name: 'Moderador', value: interaction.user.tag },
                { name: 'Razón', value: reason }
            )
            .setTimestamp();

        try {
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log(`No se pudo enviar el MD de advertencia a ${target.user.tag}.`);
        }
        
        const publicWarnEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('🟡 Nueva Advertencia')
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Usuario', value: target.user.tag, inline: true },
                { name: 'Advertencias Totales', value: `${totalWarnings}`, inline: true },
                { name: 'Moderador', value: interaction.user.tag, inline: false },
                { name: 'Razón', value: reason }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [publicWarnEmbed] });
    },
};