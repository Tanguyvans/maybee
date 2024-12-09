const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');
const WETH_ABI = require('../app/abi/WETH.json'); // Add WETH ABI

dotenv.config();

interface ContractError {
    error?: {
        data?: string;
        message?: string;
    };
    message?: string;
}

interface Game {
    description: string;
    expirationDate: bigint;
    isResolved: boolean;
    requestTime: bigint;
    totalYesAmount: bigint;
    totalNoAmount: bigint;
    verificationTime: bigint;
}

async function requestSettlement(): Promise<void> {
    try {
        const { PRIVATE_KEY, NEXT_PUBLIC_CONTRACT_ADDRESS: CONTRACT_ADDRESS, SEPOLIA_RPC_URL: RPC_URL } = process.env;
        
        if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Required environment variables are missing');
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, wallet);

        // Get WETH contract
        const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"; // From your contract
        const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);

        console.log('Checking for expired bets that need settlement request...');

        const gameCount = await contract.gameCount();
        const currentTime = Math.floor(Date.now() / 1000);
        let expiredBetsFound = false;

        for (let i = 1; i <= Number(gameCount); i++) {
            const game = await contract.games(i) as Game;
            
            if (!game.isResolved && 
                Number(game.expirationDate) <= currentTime && 
                Number(game.requestTime) === 0) {
                
                expiredBetsFound = true;
                const totalPool = ethers.formatEther(
                    game.totalYesAmount + game.totalNoAmount
                );

                console.log(`\nFound expired bet #${i}:`);
                console.log(`Description: ${game.description}`);
                console.log(`Expiration: ${new Date(Number(game.expirationDate) * 1000).toLocaleString()}`);
                console.log(`Total Pool: ${totalPool} ETH`);
                
                try {
                    const reward = ethers.parseEther("0.02");
                    const bond = ethers.parseEther("0.05");
                    const totalAmount = reward + bond;

                    console.log('Preparing settlement request...');
                    
                    // 1. Wrap ETH to WETH
                    console.log('Wrapping ETH to WETH...');
                    const wrapTx = await wethContract.deposit({ value: totalAmount });
                    await wrapTx.wait();
                    
                    // 2. Approve BettingContract to spend WETH
                    console.log('Approving BettingContract to spend WETH...');
                    const approveTx = await wethContract.approve(CONTRACT_ADDRESS, totalAmount);
                    await approveTx.wait();

                    // 3. Request settlement
                    console.log('Requesting settlement...');
                    const tx = await contract.requestSettlement(
                        i,              // gameId
                        reward,         // reward amount
                        bond            // bond amount
                    );
                    
                    console.log('Transaction sent:', tx.hash);
                    const receipt = await tx.wait();
                    if (receipt.status === 0) {
                        throw new Error('Transaction failed');
                    }
                    console.log('Settlement requested in block:', receipt.blockNumber);
                    
                    const verificationTime = Number(game.verificationTime);
                    console.log(`⏳ Waiting period (${verificationTime} seconds) has started`);
                    console.log(`Settlement can be executed after: ${new Date(currentTime * 1000 + verificationTime * 1000).toLocaleString()}`);

                } catch (err) {
                    const error = err as ContractError;
                    console.error(`Error requesting settlement for bet #${i}:`, error.message || 'Unknown error');
                    
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
                }

                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (!expiredBetsFound) {
            console.log('\nNo expired bets found that need settlement request.');
            console.log('Note: Only expired bets that haven\'t had settlement requested can be processed.');
        }

    } catch (err) {
        const error = err as ContractError;
        console.error('Error:', error.message || 'Unknown error');
        throw error;
    }
}

// Execute the script
requestSettlement()
    .then(() => process.exit(0))
    .catch(() => {
        process.exit(1);
    });