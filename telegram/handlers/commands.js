const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const config = require("../config");
const { generateTelegramHash, sendToChannelTopic } = require("../utils/helper");

const welcomeMessage = `
*Welcome to Maybee! 🐝✨*

*Maybee* makes it *super easy* to place fun wagers with just a few taps. You can either join a cozy *hive of friends* for some friendly competition, or dive into the buzz of a *big crowd* to test your instincts!

💡 *Check out our betting channels:*

🔸 [Hottest 24H](https://t.me/${config.CHANNEL_ID.slice(1)}/${
  config.HOTTEST_24H_TOPIC_ID
})
🔸 [Hottest 1H](https://t.me/${config.CHANNEL_ID.slice(1)}/${
  config.HOTTEST_1H_TOPIC_ID
})

*Win and you'll get honey! 🍯*  
*Lose and you'll get stung! 🐝*

*Are you ready to play? 🕹️*
`;

const newUserWelcomeMessage = `
*Welcome to the Maybee Hive! 🐝*

Great to have you join our community! In Maybee, you can create prediction markets and place bets on future events.

*Available Commands:*
/start - Display welcome message
/help - Show available commands
/createmarket - Start creating a new prediction market
/placebet - Place a bet on an existing market
/markets - List all active markets
/mybets - View your current bets

*Ready to predict the future? Let's bee right! 🍯*
`;

async function sendImageToChat(ctx, chatId, imagePath, caption = "") {
  try {
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return;
    }

    // Send the photo
    await ctx.telegram.sendPhoto(
      chatId,
      { source: fs.createReadStream(imagePath) },
      {
        caption: caption,
        parse_mode: "Markdown",
      }
    );

    console.log(`Image sent successfully to chat ID: ${chatId}`);
  } catch (error) {
    console.error("Error sending image:", error);
  }
}

exports.handleStart = async (ctx) => {
  // Obtenir l'ID du chat (groupe ou privé)
  const chatId = ctx.chat.id;

  // Encoder chatId en base64
  const encodedChatId = Buffer.from(chatId.toString()).toString("base64");

  // Obtenir le type de chat
  const chatType = ctx.chat.type;

  // Obtenir le titre du groupe (si c'est un groupe)
  const groupTitle = ctx.chat.title || "Private Chat";

  console.log(
    `Command executed in: ${
      chatType === "private" ? "Private Chat" : `Group "${groupTitle}"`
    }`
  );
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

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Create Market 🆕",
            url: `https://${config.MAYBEE_APP_URL_CREATE}?startapp=${encodedChatId}`,
          },
        ],
        [
          {
            text: "Join Market 🤝",
            url: `https://${config.MAYBEE_APP_URL_JOIN}?startapp=${encodedChatId}`,
          },
        ],
      ],
    },
  };

  await ctx.replyWithPhoto(
    { source: path.join(__dirname, "..", config.IMAGE_PATH) },
    {
      caption: welcomeMessage,
      parse_mode: "Markdown",
      ...keyboard,
      disable_web_page_preview: true,
    }
  );
};

exports.handleHelp = async (ctx) => {
  const helpMessage = `
*Maybee Bot Commands 🐝*

/start - Display welcome message
/help - Show this help message
/createmarket - Start creating a new prediction market
/placebet - Place a bet on an existing market
/markets - List all active markets
/mybets - View your current bets

*Need more help?*
Visit our [website](https://maybee.xyz) or join our [community](https://t.me/${config.CHANNEL_ID.slice(
    1
  )})
`;

  await ctx.reply(helpMessage, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
};

exports.handleNewChatMembers = async (ctx) => {
  // Check if there are new members
  if (
    !ctx.message.new_chat_members ||
    ctx.message.new_chat_members.length === 0
  ) {
    return;
  }

  // Get chat info
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;
  const groupTitle = ctx.chat.title || "Group Chat";

  console.log(
    `New members joined: ${
      chatType === "private" ? "Private Chat" : `Group "${groupTitle}"`
    }`
  );

  // Welcome each new member
  for (const newMember of ctx.message.new_chat_members) {
    const firstName = newMember.first_name;
    const username = newMember.username ? `@${newMember.username}` : firstName;

    const personalWelcomeMessage = `Welcome, ${firstName}! 🐝\n\n${newUserWelcomeMessage}`;

    // Send welcome message with bot image
    await ctx.replyWithPhoto(
      { source: path.join(__dirname, "..", config.IMAGE_PATH) },
      {
        caption: personalWelcomeMessage,
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
        disable_web_page_preview: true,
      }
    );
  }
};

exports.handleCreateMarket = async (ctx) => {
  const chatId = ctx.chat.id;
  const encodedChatId = Buffer.from(chatId.toString()).toString("base64");

  // Create step-by-step process or redirect to web app
  await ctx.reply(
    "To create a new prediction market, please use our web interface:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Create Market 🆕",
              url: `https://${config.MAYBEE_APP_URL_CREATE}?startapp=${encodedChatId}`,
            },
          ],
        ],
      },
    }
  );
};

exports.handlePlaceBet = async (ctx) => {
  const chatId = ctx.chat.id;
  const encodedChatId = Buffer.from(chatId.toString()).toString("base64");

  // Redirect to web app for placing bets
  await ctx.reply(
    "To place a bet on a prediction market, please use our web interface:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Place Bet 🎲",
              url: `https://${config.MAYBEE_APP_URL_JOIN}?startapp=${encodedChatId}`,
            },
          ],
        ],
      },
    }
  );
};

exports.handleListMarkets = async (ctx) => {
  try {
    // Read markets from JSON file
    const marketsPath = path.join(__dirname, "../../markets.json");
    let markets = [];

    if (fs.existsSync(marketsPath)) {
      const marketsData = fs.readFileSync(marketsPath, "utf8");
      markets = JSON.parse(marketsData);
    }

    if (markets.length === 0) {
      await ctx.reply(
        "No active markets found. Be the first to create one with /createmarket!"
      );
      return;
    }

    // Display active markets with pagination (max 5 per message)
    const maxMarketsPerMessage = 5;
    const totalPages = Math.ceil(markets.length / maxMarketsPerMessage);

    for (let page = 0; page < totalPages; page++) {
      const pageMarkets = markets.slice(
        page * maxMarketsPerMessage,
        (page + 1) * maxMarketsPerMessage
      );
      let marketMessage =
        page === 0 ? "*Active Prediction Markets 📊*\n\n" : "";

      for (const market of pageMarkets) {
        const expirationDate = new Date(
          Number(market.expirationDate) * 1000
        ).toLocaleDateString();
        marketMessage += `*Market ID:* ${market.marketId}\n`;
        marketMessage += `*Description:* ${market.description.substring(
          0,
          100
        )}${market.description.length > 100 ? "..." : ""}\n`;
        marketMessage += `*Total Pool:* ${(
          parseFloat(market.totalYesAmount) + parseFloat(market.totalNoAmount)
        ).toFixed(4)} ETH\n`;
        marketMessage += `*Expires:* ${expirationDate}\n\n`;
      }

      await ctx.reply(marketMessage, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    }
  } catch (error) {
    console.error("Error listing markets:", error);
    await ctx.reply(
      "Sorry, there was an error retrieving the markets. Please try again later."
    );
  }
};

exports.handleMyBets = async (ctx) => {
  // This would require a database to track user bets
  // For now, we'll just return a message
  await ctx.reply(
    "This feature is coming soon! You will be able to view all your active bets here."
  );
};

exports.handleTestMessage = async (ctx) => {
  console.log("Test message command received");

  const message = `This is a test message with a photo and inline keyboard.

Check out this market!`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Market",
            url: config.MAYBEE_APP_URL,
          },
        ],
      ],
    },
  };

  await sendToChannelTopic(
    ctx.telegram,
    config.CHANNEL_ID,
    config.HOTTEST_1H_TOPIC_ID,
    message,
    path.join(__dirname, "..", config.IMAGE_PATH),
    keyboard
  );

  ctx.reply("Test message sent");
};
