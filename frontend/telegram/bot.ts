const { Telegraf } = require("telegraf");
const config = require('./config');
const { handleStart, handleTestMessage } = require('./handlers/commands');
const { setupPeriodicUpdates } = require('./utils/periodicUpdates');

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

bot.start(handleStart);
bot.command('testmessage', handleTestMessage);

bot.command('createbet', (ctx: any) => {
  const groupId = ctx.chat.id;
  
  // Encoder le groupId en base64
  const encodedGroupId = Buffer.from(groupId.toString()).toString('base64');
  
  const webAppUrl = `https://t.me/maybee01_bot/maybee_app_create?startapp=${encodedGroupId}`;
  
  ctx.reply('Cliquez sur le bouton ci-dessous pour créer un nouveau pari:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Créer un pari', web_app: { url: webAppUrl } }
      ]]
    }
  });
});

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