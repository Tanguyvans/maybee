const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const config = require("../config");

// Path to market and bet data files
const MARKETS_FILE_PATH = path.join(__dirname, "../../markets.json");
const BETS_FILE_PATH = path.join(__dirname, "../../allBets.json");

/**
 * Read data from a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Array} - Array of data or empty array if file doesn't exist
 */
const readJsonFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
};

/**
 * Write data to a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Array} data - Data to write to the file
 */
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
  }
};

/**
 * Create a new prediction market
 * @param {Object} marketData - Market data
 * @returns {Object} - Created market
 */
const createMarketService = async (marketData) => {
  try {
    // Read existing markets
    const markets = readJsonFile(MARKETS_FILE_PATH);

    // Generate a new market ID
    const marketId =
      markets.length > 0
        ? Math.max(...markets.map((m) => parseInt(m.marketId))) + 1
        : 1;

    // Create new market object
    const newMarket = {
      marketId: marketId.toString(),
      description: marketData.description,
      creator:
        marketData.creator || "0x504b635B7E22F8DF7d037cf31639811AE583E9f0", // Default creator
      expirationDate: Math.floor(
        new Date(marketData.expirationDate).getTime() / 1000
      ),
      expirationDateFormatted: new Date(
        marketData.expirationDate
      ).toLocaleString(),
      verificationTime: 600, // Default verification time (10 minutes)
      isResolved: false,
      totalYesAmount: "0.0",
      totalNoAmount: "0.0",
      requestTime: 0,
      requestTimeFormatted: "Not requested",
      outcome: "NO", // Default outcome
      category: marketData.category.toUpperCase() || "CRYPTO",
      imageUrl: marketData.imageUrl || "https://i.ibb.co/YPq8Jw7/bitcoin.png", // Default image
    };

    // Add to markets array
    markets.push(newMarket);

    // Write updated markets back to file
    writeJsonFile(MARKETS_FILE_PATH, markets);

    // Also update allMarkets.json
    const allMarketsPath = path.join(__dirname, "../../allMarkets.json");
    const allMarkets = readJsonFile(allMarketsPath);

    const allMarketEntry = {
      id: parseInt(newMarket.marketId),
      description: newMarket.description,
      creator: newMarket.creator,
      expirationDate: new Date(newMarket.expirationDate * 1000).toISOString(),
      isResolved: newMarket.isResolved,
      yesAmount: newMarket.totalYesAmount,
      noAmount: newMarket.totalNoAmount,
      totalPool: "0.000000",
      status: "ACTIVE",
      category: newMarket.category,
      imageUrl: newMarket.imageUrl,
    };

    allMarkets.push(allMarketEntry);
    writeJsonFile(allMarketsPath, allMarkets);

    // Also update activeMarkets.json
    const activeMarketsPath = path.join(__dirname, "../../activeMarkets.json");
    const activeMarkets = readJsonFile(activeMarketsPath);
    activeMarkets.push(allMarketEntry);
    writeJsonFile(activeMarketsPath, activeMarkets);

    return newMarket;
  } catch (error) {
    console.error("Error creating market:", error);
    throw error;
  }
};

/**
 * Place a bet on a prediction market
 * @param {string} marketId - ID of the market
 * @param {string} bettor - Address of the bettor
 * @param {string} outcome - Outcome (YES or NO)
 * @param {string} amount - Amount of ETH to bet
 * @returns {Object} - Updated market
 */
const placeBetService = async (marketId, bettor, outcome, amount) => {
  try {
    // Read existing markets
    const markets = readJsonFile(MARKETS_FILE_PATH);

    // Find market by ID
    const marketIndex = markets.findIndex(
      (m) => m.marketId === marketId.toString()
    );

    if (marketIndex === -1) {
      throw new Error(`Market with ID ${marketId} not found`);
    }

    // Update market based on bet outcome
    if (outcome.toUpperCase() === "YES") {
      markets[marketIndex].totalYesAmount = (
        parseFloat(markets[marketIndex].totalYesAmount) + parseFloat(amount)
      ).toString();
    } else {
      markets[marketIndex].totalNoAmount = (
        parseFloat(markets[marketIndex].totalNoAmount) + parseFloat(amount)
      ).toString();
    }

    // Write updated markets back to file
    writeJsonFile(MARKETS_FILE_PATH, markets);

    // Update bets file
    const bets = readJsonFile(BETS_FILE_PATH);

    const newBet = {
      betId:
        bets.length > 0 ? Math.max(...bets.map((b) => b.betId || 0)) + 1 : 1,
      marketId: marketId.toString(),
      bettor,
      outcome: outcome.toUpperCase(),
      amount,
      timestamp: Math.floor(Date.now() / 1000),
    };

    bets.push(newBet);
    writeJsonFile(BETS_FILE_PATH, bets);

    // Update allMarkets.json and activeMarkets.json
    updateMarketInFiles(markets[marketIndex]);

    return markets[marketIndex];
  } catch (error) {
    console.error("Error placing bet:", error);
    throw error;
  }
};

/**
 * Update a market in all relevant files
 * @param {Object} market - Updated market object
 */
const updateMarketInFiles = (market) => {
  try {
    // Update in allMarkets.json
    const allMarketsPath = path.join(__dirname, "../../allMarkets.json");
    const allMarkets = readJsonFile(allMarketsPath);

    const allMarketIndex = allMarkets.findIndex(
      (m) => m.id === parseInt(market.marketId)
    );

    if (allMarketIndex !== -1) {
      allMarkets[allMarketIndex].yesAmount = market.totalYesAmount;
      allMarkets[allMarketIndex].noAmount = market.totalNoAmount;
      allMarkets[allMarketIndex].totalPool = (
        parseFloat(market.totalYesAmount) + parseFloat(market.totalNoAmount)
      ).toFixed(6);

      writeJsonFile(allMarketsPath, allMarkets);
    }

    // Update in activeMarkets.json
    const activeMarketsPath = path.join(__dirname, "../../activeMarkets.json");
    const activeMarkets = readJsonFile(activeMarketsPath);

    const activeMarketIndex = activeMarkets.findIndex(
      (m) => m.id === parseInt(market.marketId)
    );

    if (activeMarketIndex !== -1) {
      activeMarkets[activeMarketIndex].yesAmount = market.totalYesAmount;
      activeMarkets[activeMarketIndex].noAmount = market.totalNoAmount;
      activeMarkets[activeMarketIndex].totalPool = (
        parseFloat(market.totalYesAmount) + parseFloat(market.totalNoAmount)
      ).toFixed(6);

      writeJsonFile(activeMarketsPath, activeMarkets);
    }
  } catch (error) {
    console.error("Error updating market in files:", error);
  }
};

/**
 * Get all active markets
 * @returns {Array} - Array of active markets
 */
const getActiveMarkets = () => {
  try {
    const markets = readJsonFile(MARKETS_FILE_PATH);
    return markets.filter((market) => {
      const expirationDate = new Date(market.expirationDate * 1000);
      return !market.isResolved && expirationDate > new Date();
    });
  } catch (error) {
    console.error("Error getting active markets:", error);
    return [];
  }
};

/**
 * Get a market by ID
 * @param {string} marketId - Market ID
 * @returns {Object} - Market object or null if not found
 */
const getMarketById = (marketId) => {
  try {
    const markets = readJsonFile(MARKETS_FILE_PATH);
    return (
      markets.find((market) => market.marketId === marketId.toString()) || null
    );
  } catch (error) {
    console.error("Error getting market by ID:", error);
    return null;
  }
};

module.exports = {
  createMarketService,
  placeBetService,
  getActiveMarkets,
  getMarketById,
};
