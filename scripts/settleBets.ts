const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function settleBets() {
    try {
        // Configuration
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC_URL;

        if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        // Connect to network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, wallet);

        console.log('Checking for bets ready to settle...');

        // Get the total number of markets and use hardcoded LIVENESS for now
        const marketCount = await contract.marketCount();
        const LIVENESS = 1800; // 30 minutes in seconds
        const currentTime = Math.floor(Date.now() / 1000);
        let settleableMarketsFound = false;

        console.log(`Liveness period: ${LIVENESS} seconds`);

        // Loop through all markets
        for (let i = 1; i <= marketCount; i++) {
            const market = await contract.markets(i);
            
            // Check if market is ready to be settled
            if (!market.isResolved && 
                market.requestTime > 0 && 
                currentTime >= Number(market.requestTime) + LIVENESS) {
                
                settleableMarketsFound = true;
                console.log(`\nFound settleable bet #${i}:`);
                console.log(`Description: ${market.description}`);
                console.log(`Expiration: ${new Date(Number(market.expirationDate) * 1000).toLocaleString()}`);
                console.log(`Settlement requested: ${new Date(Number(market.requestTime) * 1000).toLocaleString()}`);
                console.log(`Liveness period ends: ${new Date((Number(market.requestTime) + LIVENESS) * 1000).toLocaleString()}`);
                console.log(`Total Pool: ${ethers.formatEther(BigInt(market.totalYesAmount) + BigInt(market.totalNoAmount))} ETH`);
                
                try {
                    console.log('Settling bet...');
                    const tx = await contract.settleMarket(i, { 
                        gasLimit: 500000 
                    });
                    console.log('Transaction sent:', tx.hash);
                    
                    const receipt = await tx.wait();
                    console.log('Bet settled in block:', receipt.blockNumber);

                    // Get the settlement result from the event
                    const event = receipt.logs.find(
                        (log: any) => log.fragment?.name === 'MarketResolved'
                    );

                    if (event) {
                        const [marketId, outcome] = event.args;
                        console.log(`Bet #${marketId} settled with outcome: ${outcome ? 'YES' : 'NO'}`);
                    }

                    // Add a small delay between settlements
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } catch (error: any) {
                    console.error(`Error settling bet #${i}:`, error);
                    if (error.reason) {
                        console.error('Reason:', error.reason);
                    }
                    
                    // Log current state for debugging
                    console.log('\nCurrent market state:');
                    console.log('Is Resolved:', market.isResolved);
                    console.log('Request Time:', new Date(Number(market.requestTime) * 1000).toLocaleString());
                    console.log('Current Time:', new Date(currentTime * 1000).toLocaleString());
                    console.log('Liveness Period Ends:', new Date((Number(market.requestTime) + LIVENESS) * 1000).toLocaleString());
                    console.log('Ready to Settle:', currentTime >= Number(market.requestTime) + LIVENESS);
                }
            }
        }

        if (!settleableMarketsFound) {
            console.log('\nNo bets are ready to be settled.');
            console.log(`Note: Bets must have completed the Oracle liveness period (${LIVENESS} seconds) after settlement request.`);
        }

    } catch (error: any) {
        console.error('Error:', error);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
    }
}

// Run the script
if (require.main === module) {
    settleBets()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = settleBets;