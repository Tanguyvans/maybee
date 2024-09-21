const { Telegraf } = require("telegraf");
const jwt = require("jsonwebtoken");
const nodeCrypto = require("crypto");
const path = require('path');

require('dotenv').config();

// Environment variables
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOGIN_URL = process.env.LOGIN_URL;

if (!TOKEN || !LOGIN_URL) {
  console.error(
    "Please add your Telegram bot token and app URL to the .env file"
  );
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf(TOKEN);

/**
 * Start command handling for the bot
 */
bot.start(async (ctx: any) => {
  // Extract user data from the context
  const userData = {
    authDate: Math.floor(new Date().getTime()),
    firstName: ctx.update.message.from.first_name,
    lastName: "",
    username: ctx.update.message.from.username,
    id: ctx.update.message.from.id,
    photoURL: "",
  };

  // Generate the hash for Telegram authentication
  const hash = generateTelegramHash(userData);

  // Create JWT with user data and hash
  const telegramAuthToken = jwt.sign(
    {
      ...userData,
      hash,
    },
    TOKEN, // Use the bot token to sign the JWT
    { algorithm: "HS256" }
  );
  console.log("[DEBUG] JWT generated for user", userData);

  // URL-encode the generated JWT for safe usage in a URL
  const encodedTelegramAuthToken = encodeURIComponent(telegramAuthToken);

  // Create the inline keyboard with the Mini Web App button
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Mini Web App 🚀",
            web_app: {
              url: `${LOGIN_URL}/?telegramAuthToken=${encodedTelegramAuthToken}`,
            },
          },
        ],
      ],
    },
  };

  // Send a welcome message with the inline keyboard
  await ctx.replyWithPhoto(
    { source: path.join(__dirname, 'image.png') }, // Replace with the URL of your image
    {
      caption: `Welcome to Maybee! 

      Maybee is an app to place small bets easily and quickly.

      You can use it to bet with friends or individually.

      Find some topics to bet on in our channels: 

      [Hottest 24H](https://t.me/maybee_community/2)

      [Hottest 1H](https://t.me/maybee_community/4)`,
      parse_mode: 'Markdown',
      ...keyboard,
      disable_web_page_preview: true
    }
  );
});

bot.command('testmessage', async (ctx: any) => {
  console.log('Test message command received');
  const channelId = '@maybee_community';
  const topic2Id = 4;
  await sendToChannelTopic(channelId, topic2Id, 'This is a test message');
  ctx.reply('Test message sent');
});

// Function to send a message to a specific topic in a channel
async function sendToChannelTopic(channelId: string, topicId: number, message: string) {
  try {
    await bot.telegram.sendMessage(channelId, message, {
      message_thread_id: topicId,
      parse_mode: 'Markdown'
    });
    console.log(`Message sent to channel ${channelId}, topic ${topicId}`);
  } catch (error) {
    console.error(`Error sending message to channel ${channelId}, topic ${topicId}:`, error);
  }
}

// Function to update topics periodically
function updateTopicsPeriodically() {
  const channelId = '@maybee_community';
  const topic1Id = 2; // Topic ID for "Hottest 24H"
  const topic2Id = 4; // Topic ID for "Hottest 1H"

  // Update for Hottest 1H (every 1 minute)
  setInterval(async () => {
    console.log('Interval triggered for Hottest 1H, attempting to send message...');
    const currentTime = new Date().toISOString();
    await sendToChannelTopic(channelId, topic2Id, `Hottest 1H update at ${currentTime}`);
  }, 60000); // 1 minute in milliseconds

  // Update for Hottest 24H (every 10 minutes)
  setInterval(async () => {
    console.log('Interval triggered for Hottest 24H, attempting to send message...');
    const currentTime = new Date().toISOString();
    await sendToChannelTopic(channelId, topic1Id, `Hottest 24H update at ${currentTime}`);
  }, 600000); // 10 minutes in milliseconds

  console.log('Periodic updates set up for both topics');
}

// Launch the bot
bot.launch();

updateTopicsPeriodically();


/**
 * Function to generate HMAC hash for Telegram authentication
 * @param {Object} data - User data to be hashed
 * @returns {string} - Generated HMAC hash
 */
const generateTelegramHash = (data: any) => {
  // Prepare the data object with required fields
  const useData = {
    auth_date: String(data.authDate),
    first_name: data.firstName,
    id: String(data.id),
    last_name: data.lastName,
    photo_url: data.photoURL,
    username: data.username,
  };

  // Filter out undefined or empty values from the data object
  const filteredUseData = Object.entries(useData).reduce(
    (acc: { [key: string]: any }, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    },
    {} as { [key: string]: any }
  );

  // Sort the entries and create the data check string
  const dataCheckArr = Object.entries(filteredUseData)
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

  // Create SHA-256 hash from the bot token
  const TELEGRAM_SECRET = nodeCrypto
    .createHash("sha256")
    .update(TOKEN)
    .digest();

  // Generate HMAC-SHA256 hash from the data check string
  return nodeCrypto
    .createHmac("sha256", TELEGRAM_SECRET)
    .update(dataCheckArr)
    .digest("hex");
};
