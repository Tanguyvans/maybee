const { Telegraf } = require("telegraf");
const config = require('./config');
const { handleStart, handleTestMessage } = require('./handlers/commands');
const { setupPeriodicUpdates } = require('./utils/periodicUpdates');

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

bot.start(handleStart);
bot.command('testmessage', handleTestMessage);

// Ajoutez cette ligne pour logger tous les messages reçus
bot.on('message', (ctx: any) => {
    console.log('Message reçu:', ctx.message);
    console.log('Chat info:', ctx.chat);
  });

bot.launch();
setupPeriodicUpdates(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));