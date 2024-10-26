const fs = require('fs');
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

async function sendImageToChat(ctx, chatId, imagePath, caption = '') {
  try {
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      console.error('Image file not found:', imagePath);
      return;
    }

    // Send the photo
    await ctx.telegram.sendPhoto(chatId, 
      { source: fs.createReadStream(imagePath) },
      { 
        caption: caption,
        parse_mode: 'Markdown'
      }
    );

    console.log(`Image sent successfully to chat ID: ${chatId}`);
  } catch (error) {
    console.error('Error sending image:', error);
  }
}

exports.handleStart = async (ctx) => {
  // Obtenir l'ID du chat (groupe ou privé)
  const chatId = ctx.chat.id;

  // Encoder chatId en base64
  const encodedChatId = Buffer.from(chatId.toString()).toString('base64');

  // Obtenir le type de chat
  const chatType = ctx.chat.type;
  
  // Obtenir le titre du groupe (si c'est un groupe)
  const groupTitle = ctx.chat.title || 'Private Chat';

  console.log(`Command executed in: ${chatType === 'private' ? 'Private Chat' : `Group "${groupTitle}"`}`);
  console.log(`Chat ID: ${chatId}`);
  console.log(`Encoded Chat ID: ${encodedChatId}`);
  
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

  const isGroup = chatType === 'group' || chatType === 'supergroup';

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Mini Web App 🚀",
            url: `${config.MAYBEE_APP_URL}?telegramAuthToken=${encodedTelegramAuthToken}&cid=${encodedChatId}`,
          },
        ],
        [
          {
            text: `Your chat id: ${chatId}`,
            url: `${config.MAYBEE_APP_URL}?telegramAuthToken=${encodedTelegramAuthToken}&cid=${encodedChatId}`,
          },
        ],
        [
          {
            text: "Create 🆕",
            url: `https://${config.MAYBEE_APP_URL_CREATE}?startapp=${encodedChatId}`,
          },
          {
            text: "Join 🤝",
            url: `${config.MAYBEE_APP_URL}/join?cid=${encodedChatId}`,
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

  const imagePath = path.join(__dirname, '..', config.IMAGE_PATH);
  const caption = "Response message";

  await sendImageToChat(ctx, chatId, imagePath, caption);
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