const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

interface Log {
    fragment?: {
        name: string;
    };
    args: any[];
}

interface ContractError extends Error {
    reason?: string;
}

async function createBet() {
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

        // Bet details
        const title = "A";
        const description = "A";
        const expirationDate = Math.floor(new Date('2025-03-07T20:48:00').getTime() / 1000);
        const verificationTime = 900; // 1 hour in seconds
        const gameDetails = "A";

        console.log('Creating bet with details:', {
            title,
            description,
            expirationDate: new Date(expirationDate * 1000).toLocaleString(),
            verificationTime: `${verificationTime / 3600} hours`,
            gameDetails
        });

        // Create the bet
        const tx = await contract.createGame(
            title,
            description,
            expirationDate,
            verificationTime,
            gameDetails
        );

        console.log('Transaction sent:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Get the game ID from the event
        const event = receipt.logs.find(
            (log: Log) => log.fragment?.name === 'GameCreated'
        );

        if (event) {
            const [gameId, desc, expDate, verTime] = event.args;
            console.log('Game created successfully:', {
                gameId: gameId.toString(),
                description: desc,
                expirationDate: new Date(Number(expDate) * 1000).toLocaleString(),
                verificationTime: `${Number(verTime) / 3600} hours`
            });
        }

    } catch (error: unknown) {
        console.error('Error creating bet:', error);
        if (error && typeof error === 'object' && 'reason' in error) {
            console.error('Reason:', (error as ContractError).reason);
        }
    }
}

// Run the script
createBet().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});