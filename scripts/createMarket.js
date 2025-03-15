const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

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

        // Market details
        const title = "Will the price of Bitcoin (BTC) reach $100,000 USD on any major exchange before March 15, 2025 23:59:59 UTC?";
        const description = "This market resolves to YES if the price of Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before December 31, 2024 23:59:59 UTC. Otherwise, it resolves to NO.";
        const options = ["No", "Yes"];
        const expirationDate = Math.floor(new Date('2025-03-15T22:30:00').getTime() / 1000);
        const verificationTime = 600;
        const imageUrl = "https://i.ibb.co/YPq8Jw7/bitcoin.png";
        const category = 1;

        console.log('Creating market with details:', {
            title,
            description,
            options,
            expirationDate: new Date(expirationDate * 1000).toLocaleString(),
            verificationTime: `${verificationTime / 60} minutes`,
            imageUrl,
            category
        });

        // Create the market
        const tx = await contract.createMarketAdmin(
            title,
            description,
            options,
            expirationDate,
            verificationTime,
            imageUrl,
            category
        );

        console.log('Transaction sent:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Process logs to find our event
        let foundEvent = false;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog({
                    topics: log.topics,
                    data: log.data
                });
                
                if (parsedLog && parsedLog.name === 'MarketCreated') {
                    foundEvent = true;
                    console.log('Market created successfully:', {
                        marketId: parsedLog.args[0].toString(),
                        description: parsedLog.args[1],
                        expirationDate: new Date(Number(parsedLog.args[2]) * 1000).toLocaleString(),
                        verificationTime: `${Number(parsedLog.args[3]) / 60} minutes`
                    });
                    break;
                }
            } catch (e) {
                // Skip logs that can't be parsed
                continue;
            }
        }

        if (!foundEvent) {
            console.log('Market created but event not found in logs');
        }

    } catch (error) {
        console.error('Error creating market:', error);
        if (error && error.reason) {
            console.error('Reason:', error.reason);
        }
    }
}

// Run the script
createBet().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});