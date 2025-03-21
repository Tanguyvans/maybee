const { Markup } = require("telegraf");
const config = require("../config");
const { createMarketService } = require("../services/marketService");

// Store user states for the market creation wizard
const userStates = new Map();

/**
 * Initialize the market creation wizard for a user
 * @param {string} userId - The Telegram user ID
 * @returns {Object} - Initial user state
 */
const initMarketCreation = (userId) => {
  const initialState = {
    step: "description",
    marketData: {
      description: "",
      category: "",
      expirationDate: "",
      imageUrl: config.DEFAULT_MARKET_IMAGE,
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
 * Update a specific field in the market data
 * @param {string} userId - The Telegram user ID
 * @param {string} field - The field to update
 * @param {any} value - The new value
 */
const updateMarketData = (userId, field, value) => {
  const state = userStates.get(userId);
  if (state) {
    state.marketData[field] = value;
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
 * Handle the market description step
 * @param {Object} ctx - Telegraf context
 */
const handleDescriptionStep = async (ctx) => {
  await ctx.reply(
    '📝 *Create a New Prediction Market*\n\nFirst, please provide a detailed description of your market. The description should clearly state what event the market is predicting, and how it will be resolved.\n\nFor example: "_This market resolves to YES if Bitcoin reaches $100,000 USD before December 31, 2024._"',
    { parse_mode: "Markdown" }
  );
};

/**
 * Handle the market category step
 * @param {Object} ctx - Telegraf context
 */
const handleCategoryStep = async (ctx) => {
  const categories = config.MARKET_CATEGORIES;

  // Create a grid of category buttons (3 per row)
  const buttons = [];
  for (let i = 0; i < categories.length; i += 3) {
    const row = categories
      .slice(i, i + 3)
      .map((category) =>
        Markup.button.callback(category, `category:${category}`)
      );
    buttons.push(row);
  }

  await ctx.reply(
    "🏷️ *Select a Category*\n\nPlease select the most appropriate category for your prediction market:",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    }
  );
};

/**
 * Handle the market expiration date step
 * @param {Object} ctx - Telegraf context
 */
const handleExpirationStep = async (ctx) => {
  // Create time period options
  const timeOptions = [
    ["1 Day", "3 Days", "1 Week"],
    ["2 Weeks", "1 Month", "3 Months"],
    ["6 Months", "1 Year", "Custom..."],
  ];

  const buttons = timeOptions.map((row) =>
    row.map((option) => Markup.button.callback(option, `expiration:${option}`))
  );

  await ctx.reply(
    "📅 *Set Expiration Date*\n\nWhen should this prediction market expire?",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    }
  );
};

/**
 * Handle the custom expiration date input
 * @param {Object} ctx - Telegraf context
 */
const handleCustomExpirationStep = async (ctx) => {
  await ctx.reply(
    "📅 *Enter Custom Expiration Date*\n\nPlease enter the expiration date in YYYY-MM-DD format (e.g., 2024-12-31):",
    { parse_mode: "Markdown" }
  );
};

/**
 * Handle the confirmation step
 * @param {Object} ctx - Telegraf context
 * @param {Object} marketData - The collected market data
 */
const handleConfirmationStep = async (ctx, marketData) => {
  // Format the expiration date
  let formattedDate;
  try {
    formattedDate = new Date(marketData.expirationDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  } catch (error) {
    formattedDate = marketData.expirationDate;
  }

  const summaryMessage = `
📊 *Review Your Prediction Market*

*Description:* 
${marketData.description}

*Category:* ${marketData.category}
*Expires:* ${formattedDate}

Are you ready to create this market?
`;

  await ctx.reply(summaryMessage, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Create Market", "confirm:create"),
        Markup.button.callback("❌ Cancel", "confirm:cancel"),
      ],
    ]),
  });
};

/**
 * Create the market from the collected data
 * @param {Object} ctx - Telegraf context
 * @param {string} userId - The Telegram user ID
 */
const createMarket = async (ctx, userId) => {
  try {
    const state = userStates.get(userId);
    if (!state) return;

    const { marketData } = state;

    // Add creator information
    marketData.creator = userId.toString();

    // Create the market
    const newMarket = await createMarketService(marketData);

    // Clear the user state
    clearState(userId);

    // Send confirmation message
    await ctx.reply(
      `✅ *Market Created Successfully!*\n\nYour prediction market has been created with ID: ${newMarket.marketId}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("View All Markets", "view:markets")],
        ]),
      }
    );
  } catch (error) {
    console.error("Error creating market:", error);
    await ctx.reply(
      "❌ There was an error creating your market. Please try again later."
    );
    clearState(userId);
  }
};

/**
 * Calculate a future date based on a time period
 * @param {string} period - The time period (e.g., "1 Day", "1 Week")
 * @returns {Date} - The calculated future date
 */
const calculateFutureDate = (period) => {
  const now = new Date();

  if (period === "1 Day") {
    return new Date(now.setDate(now.getDate() + 1));
  } else if (period === "3 Days") {
    return new Date(now.setDate(now.getDate() + 3));
  } else if (period === "1 Week") {
    return new Date(now.setDate(now.getDate() + 7));
  } else if (period === "2 Weeks") {
    return new Date(now.setDate(now.getDate() + 14));
  } else if (period === "1 Month") {
    return new Date(now.setMonth(now.getMonth() + 1));
  } else if (period === "3 Months") {
    return new Date(now.setMonth(now.getMonth() + 3));
  } else if (period === "6 Months") {
    return new Date(now.setMonth(now.getMonth() + 6));
  } else if (period === "1 Year") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }

  return now;
};

module.exports = {
  initMarketCreation,
  getState,
  updateMarketData,
  nextStep,
  clearState,
  handleDescriptionStep,
  handleCategoryStep,
  handleExpirationStep,
  handleCustomExpirationStep,
  handleConfirmationStep,
  createMarket,
  calculateFutureDate,
};
