const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function claimWinnings(gameId: number) {
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

        // Get game details
        const game = await contract.games(gameId);
        console.log('\nGame Details:');
        console.log('Description:', game.description);
        console.log('Is Resolved:', game.isResolved);
        console.log('Outcome:', game.outcome ? 'YES' : 'NO');

        try {
            // Claim winnings
            console.log('\nClaiming winnings...');
            const tx = await contract.claimWinnings(gameId, {
                gasLimit: 200000
            });

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log('Successfully claimed winnings!');
            } else {
                console.log('Transaction failed');
            }

        } catch (error: any) {
            console.error('Error in transaction:', error.reason || error.message);
        }

    } catch (error: any) {
        console.error('Error claiming winnings:', error);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
    }
}

// If running directly from command line
if (require.main === module) {
    const gameId = process.argv[2];
    if (!gameId) {
        console.log('Usage: npx ts-node scripts/claimWinnings.ts <gameId>');
        console.log('Example: npx ts-node scripts/claimWinnings.ts 1');
        process.exit(1);
    }

    claimWinnings(parseInt(gameId))
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = claimWinnings;