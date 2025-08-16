module.exports = {
	name: "guildMemberAdd",
	once: false, // runs every time a user joins
	execute(member) {
		const channel = member.guild.systemChannel;
		const welcomeChannel = "1389288057328500846";
		if (channel) {
			channel.send(
				`Bienvenid@ ${member} al Escuadrón 404! No esperes y preséntate en <#${welcomeChannel}>🎉`,
			);
		}
	},
};
