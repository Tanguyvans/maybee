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

async function getActiveBets() {
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

        console.log('Fetching active bets...');

        // Get the total number of markets
        const marketCount = await contract.marketCount();
        console.log(`Total markets created: ${marketCount}`);

        // Fetch and display active markets
        console.log('\nActive Bets:');
        console.log('------------');

        let activeMarketsFound = false;

        // Loop through all markets
        for (let i = 1; i <= marketCount; i++) {
            const market = await contract.markets(i);
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if market is active (not expired and not resolved)
            if (!market.isResolved && Number(market.expirationDate) > currentTime) {
                activeMarketsFound = true;
                const expirationDate = new Date(Number(market.expirationDate) * 1000);
                const yesAmount = ethers.formatEther(market.totalYesAmount);
                const noAmount = ethers.formatEther(market.totalNoAmount);
                const totalAmount = parseFloat(yesAmount) + parseFloat(noAmount);

                console.log(`\nBet #${i}`);
                console.log(`Description: ${market.description}`);
                console.log(`Expiration: ${expirationDate.toLocaleString()}`);
                console.log(`Total Yes Amount: ${yesAmount} ETH`);
                console.log(`Total No Amount: ${noAmount} ETH`);
                console.log(`Total Pool: ${totalAmount} ETH`);
                console.log(`Time until expiration: ${getTimeUntil(expirationDate)}`);
                console.log(`Creator: ${market.creator}`);
                console.log(`Is Resolved: ${market.isResolved}`);
            }
        }

        if (!activeMarketsFound) {
            console.log('No active markets found.');
        }

    } catch (error: unknown) {
        console.error('Error fetching active bets:', error);
        if (error && typeof error === 'object' && 'error' in error) {
            const contractError = error as ContractError;
            if (contractError.error) {
                console.error('Error details:', contractError.error);
            }
        }
    }
}

function getTimeUntil(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) {
        return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days} days`);
    if (hours > 0) parts.push(`${hours} hours`);
    if (minutes > 0) parts.push(`${minutes} minutes`);

    return parts.join(', ');
}

// Run the script
getActiveBets().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});