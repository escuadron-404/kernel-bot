const path = require('path');
const { glob } = require('glob');

module.exports = async (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = await glob(`${eventsPath}/**/*.js`);

  for (const file of eventFiles) {
    const absolutePath = path.resolve(file);
    const event = require(absolutePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
  console.log('✅ | Manejador de eventos cargado.');
};