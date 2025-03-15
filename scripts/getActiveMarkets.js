const { ethers } = require('ethers');
const dotenv = require('dotenv');
const fs = require('fs');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function getActiveMarkets() {
    try {
        // Configuration
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC_URL;

        if (!CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        // Connect to the network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, provider);

        console.log(`Connecting to contract at: ${CONTRACT_ADDRESS}`);
        
        // Get all markets
        console.log('Fetching all markets...');
        const allMarkets = await contract.getAllMarkets();
        console.log(`Total markets: ${allMarkets.length}`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const activeMarkets = [];
        
        // Filter for active markets
        for (const market of allMarkets) {
            try {
                if (!market.isResolved && Number(market.expirationDate) > currentTime) {
                    // Convert option amounts to formatted strings, handling null values
                    const optionAmounts = market.optionAmounts.map(amount => {
                        if (amount === null || amount === undefined) {
                            return "0.0";
                        }
                        return ethers.formatEther(amount.toString());
                    });
                    
                    // Calculate total pool
                    const totalPool = optionAmounts.reduce(
                        (sum, amount) => sum + parseFloat(amount), 
                        0
                    ).toFixed(6);
                    
                    // Get category name
                    const categories = [
                        'CULTURE', 'CRYPTO', 'SPORTS', 'POLITICS', 
                        'MEMECOINS', 'GAMING', 'ECONOMY', 'AI'
                    ];
                    const categoryName = categories[Number(market.category)] || `Category ${market.category}`;
                    
                    // Format the market data
                    activeMarkets.push({
                        id: Number(market.marketId),
                        description: market.description,
                        creator: market.creator,
                        expirationDate: new Date(Number(market.expirationDate) * 1000),
                        optionAmounts: optionAmounts,
                        totalPool: totalPool,
                        category: categoryName,
                        imageUrl: market.imageUrl,
                        optionCount: Number(market.optionCount),
                        timeRemaining: formatTimeRemaining(Number(market.expirationDate) - currentTime)
                    });
                }
            } catch (error) {
                console.error(`Error processing market #${market.marketId}:`, error.message);
            }
        }
        
        console.log(`Found ${activeMarkets.length} active markets\n`);
        
        // Save to file
        fs.writeFileSync('activeMarkets.json', JSON.stringify(activeMarkets, null, 2));
        console.log(`Saved ${activeMarkets.length} active markets to activeMarkets.json`);
        
        // Display active markets
        console.log('\nActive Markets:');
        console.log('---------------\n');
        
        if (activeMarkets.length === 0) {
            console.log('No active markets found.');
        } else {
            activeMarkets.forEach(market => {
                console.log(`Market #${market.id} - ${market.category}`);
                console.log(`Description: ${market.description}`);
                console.log(`Expiration: ${market.expirationDate.toLocaleString()}`);
                console.log(`Time remaining: ${market.timeRemaining}`);
                
                // Display options and amounts
                console.log('Options:');
                for (let i = 0; i < market.optionCount; i++) {
                    const percentage = market.totalPool > 0 
                        ? ((parseFloat(market.optionAmounts[i]) / parseFloat(market.totalPool)) * 100).toFixed(2)
                        : '0.00';
                    console.log(`  Option ${i}: ${market.optionAmounts[i]} ETH (${percentage}%)`);
                }
                
                console.log(`Total Pool: ${market.totalPool} ETH`);
                console.log('-------------------\n');
            });
        }
        
        return activeMarkets;
    } catch (error) {
        console.error('Error fetching active markets:', error);
        throw error;
    }
}

// Helper function to format time remaining
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Expired';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    
    return result.trim();
}

// If running directly from command line
if (require.main === module) {
    getActiveMarkets()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = getActiveMarkets;