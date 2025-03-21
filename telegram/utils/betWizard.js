const { Markup } = require("telegraf");
const config = require("../config");
const {
  placeBetService,
  getMarketById,
  getActiveMarkets,
} = require("../services/marketService");

// Store user states for the bet placement wizard
const userStates = new Map();

/**
 * Initialize the bet placement wizard for a user
 * @param {string} userId - The Telegram user ID
 * @returns {Object} - Initial user state
 */
const initBetPlacement = (userId) => {
  const initialState = {
    step: "market_selection",
    betData: {
      marketId: "",
      outcome: "",
      amount: "",
    },
  };

  userStates.set(userId, initialState);
  return initialState;
};

/**
 * Get the current wizard state for a user
 * @param {string} userId - The Telegram user ID
 * @returns {Object|null} - Current user state or null if not in wizard
 */
const getState = (userId) => {
  return userStates.get(userId) || null;
};

/**
 * Update a specific field in the bet data
 * @param {string} userId - The Telegram user ID
 * @param {string} field - The field to update
 * @param {any} value - The new value
 */
const updateBetData = (userId, field, value) => {
  const state = userStates.get(userId);
  if (state) {
    state.betData[field] = value;
    userStates.set(userId, state);
  }
};

/**
 * Advance to the next step in the wizard
 * @param {string} userId - The Telegram user ID
 * @param {string} nextStep - The next step to go to
 */
const nextStep = (userId, nextStep) => {
  const state = userStates.get(userId);
  if (state) {
    state.step = nextStep;
    userStates.set(userId, state);
  }
};

/**
 * Clear the wizard state for a user
 * @param {string} userId - The Telegram user ID
 */
const clearState = (userId) => {
  userStates.delete(userId);
};

/**
 * Handle the market selection step
 * @param {Object} ctx - Telegraf context
 */
const handleMarketSelectionStep = async (ctx) => {
  try {
    // Get active markets
    const markets = getActiveMarkets();

    if (!markets || markets.length === 0) {
      await ctx.reply(
        "No active markets found. You can create one with /createmarket"
      );
      clearState(ctx.from.id);
      return;
    }

    const message = "🎲 *Place a Bet*\n\nPlease select a market to bet on:";

    // Create buttons for each market (up to 10)
    const buttons = markets.slice(0, 10).map((market) => {
      // Truncate description if it's too long
      const shortDesc =
        market.description.length > 30
          ? market.description.substring(0, 30) + "..."
          : market.description;

      return [
        Markup.button.callback(
          `${market.marketId}: ${shortDesc}`,
          `market:${market.marketId}`
        ),
      ];
    });

    // Add a cancel button
    buttons.push([Markup.button.callback("❌ Cancel", "bet:cancel")]);

    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    });
  } catch (error) {
    console.error("Error in market selection step:", error);
    await ctx.reply(
      "❌ There was an error retrieving markets. Please try again later."
    );
    clearState(ctx.from.id);
  }
};

/**
 * Handle the outcome selection step
 * @param {Object} ctx - Telegraf context
 * @param {string} marketId - The ID of the selected market
 */
const handleOutcomeSelectionStep = async (ctx, marketId) => {
  try {
    // Get market details
    const market = getMarketById(marketId);

    if (!market) {
      await ctx.reply("Market not found. Please try again.");
      clearState(ctx.from.id);
      return;
    }

    // Format current pool amounts
    const yesAmount = parseFloat(market.totalYesAmount).toFixed(4);
    const noAmount = parseFloat(market.totalNoAmount).toFixed(4);
    const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toFixed(4);

    const message = `
📊 *Market: ${market.marketId}*

${market.description}

*Current Pool:* ${totalPool} ETH
*Yes Amount:* ${yesAmount} ETH
*No Amount:* ${noAmount} ETH

Please select your prediction:
`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("💚 YES (Based)", "outcome:YES"),
          Markup.button.callback("❤️ NO (Cringe)", "outcome:NO"),
        ],
        [Markup.button.callback("❌ Cancel", "bet:cancel")],
      ]),
    });
  } catch (error) {
    console.error("Error in outcome selection step:", error);
    await ctx.reply(
      "❌ There was an error retrieving market information. Please try again later."
    );
    clearState(ctx.from.id);
  }
};

/**
 * Handle the bet amount step
 * @param {Object} ctx - Telegraf context
 */
const handleBetAmountStep = async (ctx) => {
  // Predefined amounts
  const amountOptions = [
    ["0.001 ETH", "0.01 ETH", "0.1 ETH"],
    ["0.25 ETH", "0.5 ETH", "1 ETH"],
    ["2 ETH", "5 ETH", "Custom..."],
  ];

  const buttons = amountOptions.map((row) =>
    row.map((option) => {
      const value = option.split(" ")[0];
      return Markup.button.callback(option, `amount:${value}`);
    })
  );

  // Add cancel button
  buttons.push([Markup.button.callback("❌ Cancel", "bet:cancel")]);

  await ctx.reply(
    "💰 *Enter Bet Amount*\n\nHow much ETH would you like to bet?",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    }
  );
};

/**
 * Handle the custom bet amount input
 * @param {Object} ctx - Telegraf context
 */
const handleCustomAmountStep = async (ctx) => {
  await ctx.reply(
    "💰 *Enter Custom Bet Amount*\n\nPlease enter the amount of ETH you want to bet (e.g., 0.75):",
    { parse_mode: "Markdown" }
  );
};

/**
 * Handle the confirmation step
 * @param {Object} ctx - Telegraf context
 * @param {Object} betData - The collected bet data
 */
const handleConfirmationStep = async (ctx, betData) => {
  try {
    // Get market details
    const market = getMarketById(betData.marketId);

    if (!market) {
      await ctx.reply("Market not found. Please try again.");
      clearState(ctx.from.id);
      return;
    }

    const summaryMessage = `
🎲 *Confirm Your Bet*

*Market:* ${market.marketId}
*Description:* ${market.description.substring(0, 100)}${
      market.description.length > 100 ? "..." : ""
    }

*Your Prediction:* ${betData.outcome}
*Bet Amount:* ${betData.amount} ETH

Are you sure you want to place this bet?
`;

    await ctx.reply(summaryMessage, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Place Bet", "confirm:bet"),
          Markup.button.callback("❌ Cancel", "bet:cancel"),
        ],
      ]),
    });
  } catch (error) {
    console.error("Error in confirmation step:", error);
    await ctx.reply(
      "❌ There was an error preparing your bet. Please try again later."
    );
    clearState(ctx.from.id);
  }
};

/**
 * Place the bet using the collected data
 * @param {Object} ctx - Telegraf context
 * @param {string} userId - The Telegram user ID
 */
const placeBet = async (ctx, userId) => {
  try {
    const state = userStates.get(userId);
    if (!state) return;

    const { betData } = state;

    // Place the bet
    const updatedMarket = await placeBetService(
      betData.marketId,
      userId.toString(),
      betData.outcome,
      betData.amount
    );

    // Clear the user state
    clearState(userId);

    // Calculate new pool total
    const totalPool = (
      parseFloat(updatedMarket.totalYesAmount) +
      parseFloat(updatedMarket.totalNoAmount)
    ).toFixed(4);

    // Send confirmation message
    await ctx.reply(
      `✅ *Bet Placed Successfully!*\n\nYou bet ${betData.amount} ETH on ${betData.outcome} for market: ${betData.marketId}\n\nThe total pool is now ${totalPool} ETH.`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "View Market Details",
              `view:market:${betData.marketId}`
            ),
          ],
        ]),
      }
    );
  } catch (error) {
    console.error("Error placing bet:", error);
    await ctx.reply(
      "❌ There was an error placing your bet. Please try again later."
    );
    clearState(userId);
  }
};

/**
 * Validate a custom amount input
 * @param {string} amount - The amount string to validate
 * @returns {Object} - Validation result with status and formatted amount
 */
const validateAmount = (amount) => {
  // Remove any non-numeric characters except decimal point
  const cleaned = amount.replace(/[^\d.]/g, "");

  // Try to parse as float
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return {
      valid: false,
      message: "Invalid amount format. Please enter a number.",
    };
  }

  // Check minimum
  const min = parseFloat(config.MIN_BET_AMOUNT);
  if (parsed < min) {
    return { valid: false, message: `Amount must be at least ${min} ETH.` };
  }

  // Check maximum
  const max = parseFloat(config.MAX_BET_AMOUNT);
  if (parsed > max) {
    return { valid: false, message: `Amount cannot exceed ${max} ETH.` };
  }

  // Format to 4 decimal places
  const formatted = parsed.toFixed(4);

  return { valid: true, amount: formatted };
};

module.exports = {
  initBetPlacement,
  getState,
  updateBetData,
  nextStep,
  clearState,
  handleMarketSelectionStep,
  handleOutcomeSelectionStep,
  handleBetAmountStep,
  handleCustomAmountStep,
  handleConfirmationStep,
  placeBet,
  validateAmount,
};
