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

interface BetDetails {
    gameId: number;
    isYes: boolean;
    amount: string;
}

async function placeBet(betDetails: BetDetails) {
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

        // Get bet details
        const game = await contract.games(betDetails.gameId);
        const currentTime = Math.floor(Date.now() / 1000);

        // Validate bet
        if (game.isResolved) {
            throw new Error('This bet has already been resolved');
        }
        if (Number(game.expirationDate) <= currentTime) {
            throw new Error('This bet has expired');
        }

        const amountInWei = ethers.parseEther(betDetails.amount);
        const betType = betDetails.isYes ? 'YES' : 'NO';

        // Display bet information
        console.log('\nBet Details:');
        console.log('============');
        console.log(`Game ID: ${betDetails.gameId}`);
        console.log(`Description: ${game.description}`);
        console.log(`Betting: ${betType}`);
        console.log(`Amount: ${betDetails.amount} ETH`);
        console.log(`Expiration: ${new Date(Number(game.expirationDate) * 1000).toLocaleString()}`);

        // Get current pool amounts
        const yesAmount = ethers.formatEther(game.totalYesAmount);
        const noAmount = ethers.formatEther(game.totalNoAmount);
        console.log(`\nCurrent Pool:`);
        console.log(`YES Pool: ${yesAmount} ETH`);
        console.log(`NO Pool: ${noAmount} ETH`);
        console.log(`Total Pool: ${parseFloat(yesAmount) + parseFloat(noAmount)} ETH`);

        // Place the bet
        console.log('\nPlacing bet...');
        const tx = await contract.placeBet(
            betDetails.gameId,
            betDetails.isYes,
            { 
                value: amountInWei,
                gasLimit: 300000 
            }
        );

        console.log('Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Get updated pool amounts
        const updatedGame = await contract.games(betDetails.gameId);
        const updatedYesAmount = ethers.formatEther(updatedGame.totalYesAmount);
        const updatedNoAmount = ethers.formatEther(updatedGame.totalNoAmount);

        console.log('\nUpdated Pool:');
        console.log(`YES Pool: ${updatedYesAmount} ETH`);
        console.log(`NO Pool: ${updatedNoAmount} ETH`);
        console.log(`Total Pool: ${parseFloat(updatedYesAmount) + parseFloat(updatedNoAmount)} ETH`);

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

// If running directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.log('Usage: npx ts-node scripts/placeBet.ts <gameId> <isYes> <amount>');
        console.log('Example: npx ts-node scripts/placeBet.ts 1 true 0.1');
        process.exit(1);
    }

    const betDetails: BetDetails = {
        gameId: parseInt(args[0]),
        isYes: args[1].toLowerCase() === 'true',
        amount: args[2]
    };

    placeBet(betDetails)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

// Export for use as module
module.exports = placeBet;