require("dotenv").config();

const config = {
  // Bot configuration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  LOGIN_URL: process.env.LOGIN_URL,
  BOT_USERNAME: process.env.BOT_USERNAME || "maybee01_bot",

  // Channel and topic IDs
  CHANNEL_ID: "@maybee_community",
  HOTTEST_24H_TOPIC_ID: 2,
  HOTTEST_1H_TOPIC_ID: 4,

  // Update intervals (in milliseconds)
  HOTTEST_1H_UPDATE_INTERVAL: 60000000, // 10 minutes
  HOTTEST_24H_UPDATE_INTERVAL: 60000000, // 10 minutes

  // Paths
  IMAGE_PATH: "./image.png",

  // Web app URLs
  MAYBEE_APP_URL: "t.me/maybee01_bot/maybee_app",
  MAYBEE_APP_URL_CREATE: "t.me/maybee01_bot/maybee_app_create",
  MAYBEE_APP_URL_JOIN: "t.me/maybee01_bot/maybee_app_join",

  HOTTEST_1H_APP_URL: "t.me/maybee01_bot/maybee_app_hottest1h",
  HOTTEST_24H_APP_URL: "t.me/maybee01_bot/maybee_app_hottest24h",

  // Market categories
  MARKET_CATEGORIES: [
    "CRYPTO",
    "POLITICS",
    "SPORTS",
    "CULTURE",
    "MEMECOINS",
    "GAMING",
    "ECONOMY",
    "AI",
  ],

  // Betting configuration
  DEFAULT_VERIFICATION_TIME: 600, // 10 minutes
  MAX_BET_AMOUNT: "10.0", // 10 ETH
  MIN_BET_AMOUNT: "0.001", // 0.001 ETH

  // Other configuration variables
  WEBSITE_URL: "https://maybee.xyz",
  DEFAULT_MARKET_IMAGE: "https://i.ibb.co/YPq8Jw7/bitcoin.png",
};

// Validate required configuration
const requiredConfigs = ["TELEGRAM_BOT_TOKEN", "LOGIN_URL"];
for (const configName of requiredConfigs) {
  if (!config[configName]) {
    console.error(`Missing required configuration: ${configName}`);
    process.exit(1);
  }
}

module.exports = config;
