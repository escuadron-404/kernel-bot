const { REST, Routes } = require('discord.js');
const { glob } = require('glob');
const path = require('path');

module.exports = async (client) => {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = await glob(`${commandsPath}/**/*.js`);

  for (const file of commandFiles) {
    const absolutePath = path.resolve(file);
    const command = require(absolutePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.log(`[ADVERTENCIA] Al comando en ${file} le falta una propiedad "data" o "execute".`);
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  (async () => {
    try {
      console.log(`Iniciando actualización de ${commands.length} comandos de aplicación (/).`);

      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );

      console.log(`✅ | ${data.length} comandos de aplicación (/) recargados exitosamente.`);
    } catch (error) {
      console.error(error);
    }
  })();
};