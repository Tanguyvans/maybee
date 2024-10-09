const path = require('path');
const config = require('../config');
const { sendToChannelTopic } = require('./helper');

exports.setupPeriodicUpdates = (bot) => {
  // Update for Hottest 1H
  setInterval(async () => {
    console.log('Interval triggered for Hottest 1H, attempting to send message...');
    const currentTime = new Date().toISOString();

    const message = `Hottest 1H update at ${currentTime}

    Check out this market!`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Market",
              url: config.HOTTEST_1H_APP_URL
            }
          ]
        ]
      }
    };

    await sendToChannelTopic(
        bot.telegram,
        config.CHANNEL_ID, 
        config.HOTTEST_1H_TOPIC_ID, 
        message,
        path.join(__dirname, '..', config.IMAGE_PATH),
        keyboard
      );
  }, config.HOTTEST_1H_UPDATE_INTERVAL);

  // Update for Hottest 24H
  setInterval(async () => {
    console.log('Interval triggered for Hottest 24H, attempting to send message...');
    const currentTime = new Date().toISOString();

    const message = `Hottest 24H update at ${currentTime}

    Check out this market!`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Market",
              url: config.HOTTEST_24H_APP_URL
            }
          ]
        ]
      }
    };

    await sendToChannelTopic(
        bot.telegram,
        config.CHANNEL_ID, 
        config.HOTTEST_24H_TOPIC_ID, 
        message,
        path.join(__dirname, '..', config.IMAGE_PATH),
        keyboard
      );
  }, config.HOTTEST_24H_UPDATE_INTERVAL);

  console.log('Periodic updates set up for both topics');
};