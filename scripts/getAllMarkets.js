const { ethers } = require('ethers');
const dotenv = require('dotenv');
const fs = require('fs');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function getAllMarkets() {
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
        console.log(`Successfully fetched ${allMarkets.length} markets`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const formattedMarkets = [];
        
        for (const market of allMarkets) {
            try {
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
                
                // Determine market status
                let status;
                if (market.isResolved) {
                    status = 'RESOLVED';
                } else if (Number(market.expirationDate) <= currentTime) {
                    status = 'EXPIRED';
                } else {
                    status = 'ACTIVE';
                }
                
                // Get category name
                const categories = [
                    'CULTURE', 'CRYPTO', 'SPORTS', 'POLITICS', 
                    'MEMECOINS', 'GAMING', 'ECONOMY', 'AI'
                ];
                const categoryName = categories[Number(market.category)] || `Category ${market.category}`;
                
                // Format the market data
                formattedMarkets.push({
                    id: Number(market.marketId),
                    description: market.description,
                    creator: market.creator,
                    expirationDate: new Date(Number(market.expirationDate) * 1000),
                    isResolved: market.isResolved,
                    optionAmounts: optionAmounts,
                    totalPool: totalPool,
                    outcome: market.isResolved ? Number(market.outcome) : undefined,
                    status: status,
                    category: categoryName,
                    imageUrl: market.imageUrl,
                    optionCount: Number(market.optionCount)
                });
            } catch (error) {
                console.error(`Error processing market #${market.marketId}:`, error.message);
            }
        }
        
        // Save to file
        fs.writeFileSync('allMarkets.json', JSON.stringify(formattedMarkets, null, 2));
        console.log(`Saved ${formattedMarkets.length} markets to allMarkets.json`);
        
        // Display markets
        console.log('\nAll Markets:');
        console.log('===========\n');
        
        formattedMarkets.forEach(market => {
            console.log(`Market #${market.id} [${market.status}] - ${market.category}`);
            console.log(`Description: ${market.description}`);
            console.log(`Expiration: ${market.expirationDate.toLocaleString()}`);
            
            // Display options and amounts
            console.log('Options:');
            for (let i = 0; i < market.optionCount; i++) {
                const percentage = market.totalPool > 0 
                    ? ((parseFloat(market.optionAmounts[i]) / parseFloat(market.totalPool)) * 100).toFixed(2)
                    : '0.00';
                console.log(`  Option ${i}: ${market.optionAmounts[i]} ETH (${percentage}%)`);
            }
            
            console.log(`Total Pool: ${market.totalPool} ETH`);
            
            if (market.isResolved) {
                console.log(`Outcome: Option ${market.outcome} won`);
            }
            console.log('-------------------\n');
        });
        
        return formattedMarkets;
    } catch (error) {
        console.error('Error fetching markets:', error);
        throw error;
    }
}

// If running directly from command line
if (require.main === module) {
    getAllMarkets()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = getAllMarkets;