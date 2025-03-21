const { Telegraf, Markup } = require("telegraf");
const config = require("./config");
const {
  handleStart,
  handleTestMessage,
  handleHelp,
  handleNewChatMembers,
  handleCreateMarket,
  handlePlaceBet,
  handleListMarkets,
  handleMyBets,
} = require("./handlers/commands");
const { setupPeriodicUpdates } = require("./utils/periodicUpdates");
const {
  createMarketService,
  placeBetService,
  getMarketById,
} = require("./services/marketService");

// Market creation wizard
const marketWizard = require("./utils/marketWizard");

// Bet placement wizard
const betWizard = require("./utils/betWizard");

// Define TelegrafContext type
interface TelegrafContext {
  from: {
    id: number;
    username?: string;
    first_name?: string;
  };
  message?: {
    text?: string;
    from?: {
      id: number;
      username?: string;
      first_name?: string;
    };
    message_id?: number;
    new_chat_members?: Array<any>;
  };
  chat?: {
    id: number;
    type: string;
    title?: string;
  };
  callbackQuery?: {
    data: string;
  };
  reply: (text: string, extra?: any) => Promise<any>;
  replyWithPhoto: (photo: any, extra?: any) => Promise<any>;
  answerCbQuery: (text?: string) => Promise<any>;
  telegram: any;
}

// Initialize bot
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Set bot description and commands list
bot.telegram.setMyCommands([
  { command: "start", description: "Start the bot and get welcome message" },
  { command: "help", description: "Show available commands" },
  { command: "createmarket", description: "Create a new prediction market" },
  { command: "placebet", description: "Place a bet on an existing market" },
  { command: "markets", description: "List all active markets" },
  { command: "mybets", description: "View your current bets" },
]);

// Command handlers
bot.start(handleStart);
bot.command("help", handleHelp);
bot.command("createmarket", (ctx: TelegrafContext) => {
  // Initialize the market creation wizard
  marketWizard.initMarketCreation(ctx.from.id);
  marketWizard.handleDescriptionStep(ctx);
});
bot.command("placebet", (ctx: TelegrafContext) => {
  // Initialize the bet placement wizard
  betWizard.initBetPlacement(ctx.from.id);
  betWizard.handleMarketSelectionStep(ctx);
});
bot.command("markets", handleListMarkets);
bot.command("mybets", handleMyBets);
bot.command("testmessage", handleTestMessage);

// Handle new chat members (user joins)
bot.on("new_chat_members", handleNewChatMembers);

// Handle market creation wizard flow
bot.on("message", async (ctx: TelegrafContext) => {
  if (!ctx.message?.text || ctx.message.text.startsWith("/")) return;

  // Check if user is in market creation process
  const marketState = marketWizard.getState(ctx.from.id);
  if (marketState) {
    const { step } = marketState;

    if (step === "description") {
      // Save description
      marketWizard.updateMarketData(
        ctx.from.id,
        "description",
        ctx.message.text
      );
      marketWizard.nextStep(ctx.from.id, "category");

      // Show category selection
      marketWizard.handleCategoryStep(ctx);
    } else if (step === "custom_expiration") {
      // Parse and validate date
      const dateInput = ctx.message.text;
      try {
        const date = new Date(dateInput);

        if (isNaN(date.getTime()) || date <= new Date()) {
          await ctx.reply(
            "❌ Please enter a valid future date in YYYY-MM-DD format."
          );
          return;
        }

        marketWizard.updateMarketData(
          ctx.from.id,
          "expirationDate",
          date.toISOString()
        );
        marketWizard.nextStep(ctx.from.id, "confirmation");

        // Show confirmation
        const marketData = marketWizard.getState(ctx.from.id).marketData;
        marketWizard.handleConfirmationStep(ctx, marketData);
      } catch (error) {
        console.error("Error parsing date:", error);
        await ctx.reply("❌ Please enter a valid date in YYYY-MM-DD format.");
      }
    }

    return;
  }

  // Check if user is in bet placement process
  const betState = betWizard.getState(ctx.from.id);
  if (betState) {
    const { step } = betState;

    if (step === "custom_amount") {
      // Validate and save amount
      const validation = betWizard.validateAmount(ctx.message.text);

      if (!validation.valid) {
        await ctx.reply(`❌ ${validation.message}`);
        return;
      }

      betWizard.updateBetData(ctx.from.id, "amount", validation.amount);
      betWizard.nextStep(ctx.from.id, "confirmation");

      // Show confirmation
      const betData = betWizard.getState(ctx.from.id).betData;
      betWizard.handleConfirmationStep(ctx, betData);
    }

    return;
  }
});

// Handle callback queries for interactive buttons
bot.on("callback_query", async (ctx: TelegrafContext) => {
  if (!ctx.callbackQuery?.data) return;

  const callbackData = ctx.callbackQuery.data;

  // Acknowledge the callback
  await ctx.answerCbQuery();

  // Handle market creation callbacks
  if (callbackData.startsWith("category:")) {
    const category = callbackData.split(":")[1];
    const userId = ctx.from.id;

    marketWizard.updateMarketData(userId, "category", category);
    marketWizard.nextStep(userId, "expiration");

    marketWizard.handleExpirationStep(ctx);
  } else if (callbackData.startsWith("expiration:")) {
    const expiration = callbackData.split(":")[1];
    const userId = ctx.from.id;

    if (expiration === "Custom...") {
      marketWizard.nextStep(userId, "custom_expiration");
      marketWizard.handleCustomExpirationStep(ctx);
    } else {
      // Calculate expiration date from predefined period
      const expirationDate = marketWizard.calculateFutureDate(expiration);
      marketWizard.updateMarketData(
        userId,
        "expirationDate",
        expirationDate.toISOString()
      );
      marketWizard.nextStep(userId, "confirmation");

      // Show confirmation
      const marketData = marketWizard.getState(userId).marketData;
      marketWizard.handleConfirmationStep(ctx, marketData);
    }
  } else if (callbackData.startsWith("confirm:")) {
    const action = callbackData.split(":")[1];
    const userId = ctx.from.id;

    if (action === "create") {
      // Create market
      await marketWizard.createMarket(ctx, userId);
    } else if (action === "bet") {
      // Place bet
      await betWizard.placeBet(ctx, userId);
    } else if (action === "cancel") {
      // Cancel wizard
      marketWizard.clearState(userId);
      betWizard.clearState(userId);
      await ctx.reply("Operation cancelled.");
    }
  }
  // Handle bet placement callbacks
  else if (callbackData.startsWith("market:")) {
    const marketId = callbackData.split(":")[1];
    const userId = ctx.from.id;

    betWizard.updateBetData(userId, "marketId", marketId);
    betWizard.nextStep(userId, "outcome");

    betWizard.handleOutcomeSelectionStep(ctx, marketId);
  } else if (callbackData.startsWith("outcome:")) {
    const outcome = callbackData.split(":")[1];
    const userId = ctx.from.id;

    betWizard.updateBetData(userId, "outcome", outcome);
    betWizard.nextStep(userId, "amount");

    betWizard.handleBetAmountStep(ctx);
  } else if (callbackData.startsWith("amount:")) {
    const amount = callbackData.split(":")[1];
    const userId = ctx.from.id;

    if (amount === "Custom") {
      betWizard.nextStep(userId, "custom_amount");
      betWizard.handleCustomAmountStep(ctx);
    } else {
      betWizard.updateBetData(userId, "amount", amount);
      betWizard.nextStep(userId, "confirmation");

      // Show confirmation
      const betData = betWizard.getState(userId).betData;
      betWizard.handleConfirmationStep(ctx, betData);
    }
  } else if (callbackData === "bet:cancel") {
    const userId = ctx.from.id;
    betWizard.clearState(userId);
    await ctx.reply("Bet placement cancelled.");
  } else if (callbackData === "view:markets") {
    await handleListMarkets(ctx);
  } else if (callbackData.startsWith("view:market:")) {
    const marketId = callbackData.split(":")[2];
    const market = getMarketById(marketId);

    if (!market) {
      await ctx.reply("Market not found.");
      return;
    }

    // Format market info
    const yesAmount = parseFloat(market.totalYesAmount).toFixed(4);
    const noAmount = parseFloat(market.totalNoAmount).toFixed(4);
    const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toFixed(4);
    const expirationDate = new Date(
      Number(market.expirationDate) * 1000
    ).toLocaleDateString();

    const marketInfo = `
📊 *Market #${market.marketId}*

${market.description}

*Category:* ${market.category}
*Expires:* ${expirationDate}
*Total Pool:* ${totalPool} ETH
*Yes Amount:* ${yesAmount} ETH
*No Amount:* ${noAmount} ETH
*Status:* ${market.isResolved ? "Resolved" : "Active"}
`;

    await ctx.reply(marketInfo, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🎲 Place Bet", `place:bet:${marketId}`)],
      ]),
    });
  } else if (callbackData.startsWith("place:bet:")) {
    const marketId = callbackData.split(":")[2];
    const userId = ctx.from.id;

    // Initialize bet placement wizard
    betWizard.initBetPlacement(userId);
    betWizard.updateBetData(userId, "marketId", marketId);
    betWizard.nextStep(userId, "outcome");

    betWizard.handleOutcomeSelectionStep(ctx, marketId);
  }
});

// Debug: Log all messages and updates
bot.on("message", (ctx: TelegrafContext) => {
  console.log("Message received:", ctx.message);
  console.log("Chat info:", ctx.chat);
});

// Launch the bot
bot.launch();
console.log("Maybee Telegram Bot is running! 🐝");

// Set up periodic updates for market info
setupPeriodicUpdates(bot);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
