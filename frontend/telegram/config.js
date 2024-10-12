require('dotenv').config();

const config = {
  // Bot configuration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  LOGIN_URL: process.env.LOGIN_URL,

  // Channel and topic IDs
  CHANNEL_ID: '@maybee_community',
  HOTTEST_24H_TOPIC_ID: 2,
  HOTTEST_1H_TOPIC_ID: 4,

  // Update intervals (in milliseconds)
  HOTTEST_1H_UPDATE_INTERVAL: 600000, // 10 minutes
  HOTTEST_24H_UPDATE_INTERVAL: 600000, // 10 minutes

  // Paths
  IMAGE_PATH: './image.png',

  // Web app URLs
  MAYBEE_APP_URL: 't.me/maybee01_bot/maybee_app',
  MAYBEE_APP_URL_CREATE: 't.me/maybee01_bot/maybee_app_create',
  
  HOTTEST_1H_APP_URL: 't.me/maybee01_bot/maybee_app_hottest1h',
  HOTTEST_24H_APP_URL: 't.me/maybee01_bot/maybee_app_hottest24h',

  // Other configuration variables
  // ...
};

// Validate required configuration
const requiredConfigs = ['TELEGRAM_BOT_TOKEN', 'LOGIN_URL'];
for (const configName of requiredConfigs) {
  if (!config[configName]) {
    console.error(`Missing required configuration: ${configName}`);
    process.exit(1);
  }
}

module.exports = config;