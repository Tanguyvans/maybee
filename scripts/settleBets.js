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

        // Try to use getAllMarkets first for efficiency
        let markets = [];
        try {
            console.log('Fetching all markets...');
            markets = await contract.getAllMarkets();
            console.log(`Successfully fetched ${markets.length} markets`);
        } catch (error) {
            console.error('Error using getAllMarkets:', error.message);
            console.log('Falling back to alternative method...');
            
            // Fallback to using getAllMarketIds and getMarketDetails
            const marketIds = await contract.getAllMarketIds();
            console.log(`Found ${marketIds.length} market IDs`);
            
            for (let i = 0; i < marketIds.length; i++) {
                const id = Number(marketIds[i]);
                try {
                    const details = await contract.getMarketDetails(id);
                    markets.push({
                        marketId: id,
                        description: details[1],
                        expirationDate: details[3],
                        isResolved: details[5],
                        totalYesAmount: details[6],
                        totalNoAmount: details[7],
                        requestTime: details[8],
                        verificationTime: details[4]
                    });
                } catch (error) {
                    console.error(`Error fetching market #${id}:`, error.message);
                }
            }
        }

        const currentTime = Math.floor(Date.now() / 1000);
        let settleableMarketsFound = false;
        let processedCount = 0;

        // Process markets that need settlement
        for (const market of markets) {
            const marketId = Number(market.marketId);
            const verificationTime = Number(market.verificationTime);
            
            // Check if market is ready to be settled
            if (!market.isResolved && 
                market.requestTime > 0 && 
                currentTime >= Number(market.requestTime) + verificationTime) {
                
                settleableMarketsFound = true;
                const totalPool = ethers.formatEther(
                    market.totalYesAmount + market.totalNoAmount
                );
                
                console.log(`\nFound settleable bet #${marketId}:`);
                console.log(`Description: ${market.description}`);
                console.log(`Expiration: ${new Date(Number(market.expirationDate) * 1000).toLocaleString()}`);
                console.log(`Settlement requested: ${new Date(Number(market.requestTime) * 1000).toLocaleString()}`);
                console.log(`Verification period: ${verificationTime} seconds`);
                console.log(`Verification period ends: ${new Date((Number(market.requestTime) + verificationTime) * 1000).toLocaleString()}`);
                console.log(`Total Pool: ${totalPool} ETH`);
                
                // Ask for confirmation before proceeding
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const confirm = await new Promise(resolve => {
                    readline.question(`Do you want to settle this bet? (y/n): `, answer => {
                        readline.close();
                        resolve(answer.toLowerCase() === 'y');
                    });
                });
                
                if (!confirm) {
                    console.log('Skipping this bet...');
                    continue;
                }
                
                try {
                    console.log('Settling bet...');
                    const tx = await contract.settleMarket(marketId, { 
                        gasLimit: 500000 
                    });
                    console.log('Transaction sent:', tx.hash);
                    console.log(`Track transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
                    
                    console.log('Waiting for transaction confirmation...');
                    const receipt = await tx.wait();
                    console.log('Bet settled in block:', receipt.blockNumber);

                    // Get the settlement result from the event
                    const event = receipt.logs.find(
                        (log) => log.fragment?.name === 'MarketResolved'
                    );

                    if (event) {
                        const [eventMarketId, outcome] = event.args;
                        console.log(`Bet #${eventMarketId} settled with outcome: ${outcome ? 'YES' : 'NO'}`);
                        
                        // Calculate winnings distribution
                        const yesAmount = ethers.formatEther(market.totalYesAmount);
                        const noAmount = ethers.formatEther(market.totalNoAmount);
                        
                        if (outcome) { // YES wins
                            console.log(`\n🏆 YES bettors win!`);
                            if (Number(noAmount) > 0) {
                                const ratio = Number(noAmount) / Number(yesAmount);
                                console.log(`Each YES bettor receives their bet + ${ratio.toFixed(2)}x their bet amount`);
                            } else {
                                console.log(`No NO bets were placed, YES bettors receive their original bet amount`);
                            }
                        } else { // NO wins
                            console.log(`\n🏆 NO bettors win!`);
                            if (Number(yesAmount) > 0) {
                                const ratio = Number(yesAmount) / Number(noAmount);
                                console.log(`Each NO bettor receives their bet + ${ratio.toFixed(2)}x their bet amount`);
                            } else {
                                console.log(`No YES bets were placed, NO bettors receive their original bet amount`);
                            }
                        }
                    }
                    
                    processedCount++;

                    // Add a small delay between settlements
                    if (processedCount < markets.length) {
                        console.log('Waiting before processing next bet...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                } catch (error) {
                    console.error(`Error settling bet #${marketId}:`, error.message || 'Unknown error');
                    
                    if (error.error?.data) {
                        try {
                            const iface = new ethers.Interface(BETTING_ABI);
                            const decodedError = iface.parseError(error.error.data);
                            if (decodedError) {
                                console.error('Decoded error:', decodedError.name, decodedError.args);
                            }
                        } catch (decodeErr) {
                            console.error('Failed to decode error:', decodeErr);
                        }
                    }
                    
                    // Log current state for debugging
                    console.log('\nCurrent market state:');
                    console.log('Is Resolved:', market.isResolved);
                    console.log('Request Time:', new Date(Number(market.requestTime) * 1000).toLocaleString());
                    console.log('Current Time:', new Date(currentTime * 1000).toLocaleString());
                    console.log('Verification Period Ends:', new Date((Number(market.requestTime) + verificationTime) * 1000).toLocaleString());
                    console.log('Ready to Settle:', currentTime >= Number(market.requestTime) + verificationTime);
                }
            }
        }

        if (!settleableMarketsFound) {
            console.log('\nNo bets are ready to be settled.');
            console.log('Note: Bets must have completed the verification period after settlement request.');
        } else {
            console.log(`\nProcessed ${processedCount} settleable bets.`);
        }

    } catch (error) {
        console.error('Error:', error.message || 'Unknown error');
        throw error;
    }
}

// Run the script
if (require.main === module) {
    settleBets()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = settleBets;