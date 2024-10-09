const nodeCrypto = require("crypto");
const config = require('../config');

exports.generateTelegramHash = (data) => {
  const useData = {
    auth_date: String(data.authDate),
    first_name: data.firstName,
    id: String(data.id),
    last_name: data.lastName,
    photo_url: data.photoURL,
    username: data.username,
  };

  const filteredUseData = Object.entries(useData).reduce(
    (acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    },
    {}
  );

  const dataCheckArr = Object.entries(filteredUseData)
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

  const TELEGRAM_SECRET = nodeCrypto
    .createHash("sha256")
    .update(config.TELEGRAM_BOT_TOKEN)
    .digest();

  return nodeCrypto
    .createHmac("sha256", TELEGRAM_SECRET)
    .update(dataCheckArr)
    .digest("hex");
};

exports.sendToChannelTopic = async (telegram, channelId, topicId, message, photo, extra) => {
  try {
    if (photo) {
      await telegram.sendPhoto(channelId, { source: photo }, {
        caption: message,
        message_thread_id: topicId,
        parse_mode: 'Markdown',
        ...extra
      });
    } else {
      await telegram.sendMessage(channelId, message, {
        message_thread_id: topicId,
        parse_mode: 'Markdown',
        ...extra
      });
    }
    console.log(`Message sent to channel ${channelId}, topic ${topicId}`);
  } catch (error) {
    console.error(`Error sending message to channel ${channelId}, topic ${topicId}:`, error);
  }
};