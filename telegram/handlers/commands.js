const jwt = require("jsonwebtoken");
const path = require('path');
const config = require('../config');
const { generateTelegramHash, sendToChannelTopic } = require('../utils/helper');

const welcomeMessage = `
*Welcome to Maybee! 🐝✨*

*Maybee* makes it *super easy* to place fun wagers with just a few taps. You can either join a cozy *hive of friends* for some friendly competition, or dive into the buzz of a *big crowd* to test your instincts!

💡 *Check out our betting channels:*

🔸 [Hottest 24H](https://t.me/${config.CHANNEL_ID.slice(1)}/${config.HOTTEST_24H_TOPIC_ID})
🔸 [Hottest 1H](https://t.me/${config.CHANNEL_ID.slice(1)}/${config.HOTTEST_1H_TOPIC_ID})

*Win and you'll get honey! 🍯*  
*Lose and you'll get stung! 🐝*

*Are you ready to play? 🕹️*
`;

exports.handleStart = async (ctx) => {
  const userData = {
    authDate: Math.floor(new Date().getTime()),
    firstName: ctx.update.message.from.first_name,
    lastName: "",
    username: ctx.update.message.from.username,
    id: ctx.update.message.from.id,
    photoURL: "",
  };

  const hash = generateTelegramHash(userData);

  const telegramAuthToken = jwt.sign(
    {
      ...userData,
      hash,
    },
    config.TELEGRAM_BOT_TOKEN,
    { algorithm: "HS256" }
  );
  console.log("[DEBUG] JWT generated for user", userData);

  const encodedTelegramAuthToken = encodeURIComponent(telegramAuthToken);

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Mini Web App 🚀",
            web_app: {
              url: `${config.LOGIN_URL}/?telegramAuthToken=${encodedTelegramAuthToken}`,
            },
          },
        ],
        [
          {
            text: "Create 🆕",
            web_app: {
              url: `${config.LOGIN_URL}/create?telegramAuthToken=${encodedTelegramAuthToken}`,
            },
          },
          {
            text: "Join 🤝",
            web_app: {
              url: `${config.LOGIN_URL}/join?telegramAuthToken=${encodedTelegramAuthToken}`,
            },
          },
        ],
      ],
    },
  };

  await ctx.replyWithPhoto(
    { source: path.join(__dirname, '..', config.IMAGE_PATH) },
    {
      caption: welcomeMessage,
      parse_mode: 'Markdown',
      ...keyboard,
      disable_web_page_preview: true
    }
  );
};

exports.handleTestMessage = async (ctx) => {
  console.log('Test message command received');

  const message = `This is a test message with a photo and inline keyboard.

Check out this market!`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Market",
            url: config.MAYBEE_APP_URL
          }
        ]
      ]
    }
  };

  await sendToChannelTopic(
    ctx.telegram,
    config.CHANNEL_ID, 
    config.HOTTEST_1H_TOPIC_ID, 
    message,
    path.join(__dirname, '..', config.IMAGE_PATH),
    keyboard
  );

  ctx.reply('Test message sent');
};