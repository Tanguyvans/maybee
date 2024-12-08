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

        // Get the total number of games
        const gameCount = await contract.gameCount();
        console.log(`Total games created: ${gameCount}`);

        // Fetch and display active games
        console.log('\nActive Bets:');
        console.log('------------');

        let activeGamesFound = false;

        // Loop through all games
        for (let i = 1; i <= gameCount; i++) {
            const game = await contract.games(i);
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if game is active (not expired and not resolved)
            if (!game.isResolved && Number(game.expirationDate) > currentTime) {
                activeGamesFound = true;
                const expirationDate = new Date(Number(game.expirationDate) * 1000);
                const yesAmount = ethers.formatEther(game.totalYesAmount);
                const noAmount = ethers.formatEther(game.totalNoAmount);
                const totalAmount = parseFloat(yesAmount) + parseFloat(noAmount);

                console.log(`\nBet #${i}`);
                console.log(`Description: ${game.description}`);
                console.log(`Expiration: ${expirationDate.toLocaleString()}`);
                console.log(`Total Yes Amount: ${yesAmount} ETH`);
                console.log(`Total No Amount: ${noAmount} ETH`);
                console.log(`Total Pool: ${totalAmount} ETH`);
                console.log(`Time until expiration: ${getTimeUntil(expirationDate)}`);
                console.log(`Creator: ${game.creator}`);
                console.log(`Is Resolved: ${game.isResolved}`);
            }
        }

        if (!activeGamesFound) {
            console.log('No active bets found.');
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