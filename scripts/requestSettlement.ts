const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

interface ContractError {
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

async function requestSettlement() {
    try {
        // Configuration
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC_URL;

        if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        // Connect to the network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, wallet);

        console.log('Checking for expired bets that need settlement request...');

        // Get the total number of games
        const gameCount = await contract.gameCount();
        const currentTime = Math.floor(Date.now() / 1000);
        let expiredBetsFound = false;

        // Loop through all games
        for (let i = 1; i <= gameCount; i++) {
            const game = await contract.games(i);
            
            // Check if game is expired but not resolved and settlement not requested
            if (!game.isResolved && 
                Number(game.expirationDate) <= currentTime && 
                Number(game.requestTime) === 0) {
                
                expiredBetsFound = true;
                const totalPool = ethers.formatEther(
                    BigInt(game.totalYesAmount) + BigInt(game.totalNoAmount)
                );

                console.log(`\nFound expired bet #${i}:`);
                console.log(`Description: ${game.description}`);
                console.log(`Expiration: ${new Date(Number(game.expirationDate) * 1000).toLocaleString()}`);
                console.log(`Total Pool: ${totalPool} ETH`);
                
                try {
                    console.log('Requesting settlement...');
                    const tx = await contract.requestSettlement(i, { 
                        gasLimit: 500000 
                    });
                    console.log('Transaction sent:', tx.hash);
                    
                    const receipt = await tx.wait();
                    console.log('Settlement requested in block:', receipt.blockNumber);
                    console.log('⏳ Waiting period (30 minutes) has started');
                    console.log(`Settlement can be executed after: ${new Date(currentTime * 1000 + 30 * 60 * 1000).toLocaleString()}`);

                } catch (error) {
                    console.error(`Error requesting settlement for bet #${i}:`, error);
                    if (error && typeof error === 'object' && 'error' in error) {
                        const contractError = error as ContractError;
                        if (contractError.error) {
                            console.error('Error details:', contractError.error);
                        }
                    }
                }

                // Add a small delay between requests to avoid nonce issues
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (!expiredBetsFound) {
            console.log('\nNo expired bets found that need settlement request.');
            console.log('Note: Only expired bets that haven\'t had settlement requested can be processed.');
        } else {
            console.log('\nReminder: After requesting settlement, you must wait 30 minutes before settling the bet.');
            console.log('Run the checkSettlements.ts script to monitor the status of your settlement requests.');
        }

    } catch (error: unknown) {
        console.error('Error:', error);
        if (error && typeof error === 'object' && 'error' in error) {
            const contractError = error as ContractError;
            if (contractError.error) {
                console.error('Error details:', contractError.error);
            }
        }
    }
}

// Run the script
requestSettlement().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});