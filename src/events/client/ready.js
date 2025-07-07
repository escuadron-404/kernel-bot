const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`🚀 ¡Listo! El bot está en línea como ${client.user.tag}`);
    client.user.setActivity('comandos en la terminal', { type: 'WATCHING' });
  },
};