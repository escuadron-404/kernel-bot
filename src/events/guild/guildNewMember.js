module.exports = {
	name: "guildMemberAdd",
	once: false, // runs every time a user joins
	execute(member) {
		const welcomeChannel = member.guild.systemChannel;
		const presentationChannel = process.env.PRESENTATION_CHANNEL_ID;
		if (welcomeChannel) {
			welcomeChannel.send(
				`Bienvenid@ ${member} al Escuadrón 404! No esperes y preséntate en <#${presentationChannel}> 🎉`,
			);
		}
	},
};
