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
    marketId: number;
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
        const market = await contract.markets(betDetails.marketId);
        const currentTime = Math.floor(Date.now() / 1000);

        // Validate bet
        if (market.isResolved) {
            throw new Error('This market has already been resolved');
        }
        if (Number(market.expirationDate) <= currentTime) {
            throw new Error('This market has expired');
        }

        const amountInWei = ethers.parseEther(betDetails.amount);
        const betType = betDetails.isYes ? 'YES' : 'NO';

        // Display bet information
        console.log('\nBet Details:');
        console.log('============');
        console.log(`Market ID: ${betDetails.marketId}`);
        console.log(`Description: ${market.description}`);
        console.log(`Betting: ${betType}`);
        console.log(`Amount: ${betDetails.amount} ETH`);
        console.log(`Expiration: ${new Date(Number(market.expirationDate) * 1000).toLocaleString()}`);

        // Get current pool amounts
        const yesAmount = ethers.formatEther(market.totalYesAmount);
        const noAmount = ethers.formatEther(market.totalNoAmount);
        console.log(`\nCurrent Pool:`);
        console.log(`YES Pool: ${yesAmount} ETH`);
        console.log(`NO Pool: ${noAmount} ETH`);
        console.log(`Total Pool: ${parseFloat(yesAmount) + parseFloat(noAmount)} ETH`);

        // Place the bet
        console.log('\nPlacing bet...');
        const tx = await contract.placeBet(
            betDetails.marketId,
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
        const updatedMarket = await contract.markets(betDetails.marketId);
        const updatedYesAmount = ethers.formatEther(updatedMarket.totalYesAmount);
        const updatedNoAmount = ethers.formatEther(updatedMarket.totalNoAmount);

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
        console.log('Usage: npx ts-node scripts/placeBet.ts <marketId> <isYes> <amount>');
        console.log('Example: npx ts-node scripts/placeBet.ts 1 true 0.1');
        process.exit(1);
    }

    const betDetails: BetDetails = {
        marketId: parseInt(args[0]),
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