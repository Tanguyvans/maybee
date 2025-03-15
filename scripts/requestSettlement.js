const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');
const WETH_ABI = require('../app/abi/WETH.json');

dotenv.config();

async function requestSettlement() {
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
                        optionAmounts: details[6],
                        requestTime: details[8],
                        verificationTime: details[4],
                        optionCount: details[11]
                    });
                } catch (error) {
                    console.error(`Error fetching market #${id}:`, error.message);
                }
            }
        }

        const currentTime = Math.floor(Date.now() / 1000);
        let expiredBetsFound = false;
        let processedCount = 0;

        // Process markets that need settlement
        for (const market of markets) {
            const marketId = Number(market.marketId);
            
            if (!market.isResolved && 
                Number(market.expirationDate) <= currentTime && 
                Number(market.requestTime) === 0) {
                
                expiredBetsFound = true;
                
                // Calculate total pool size from all options
                let totalPool = "0.0";
                try {
                    // Get total pool size using getTotalPoolSize function if available
                    const poolSizeBigInt = await contract.getTotalPoolSize(marketId);
                    totalPool = ethers.formatEther(poolSizeBigInt);
                } catch (error) {
                    // Fallback: Sum all option amounts manually
                    if (market.optionAmounts && market.optionAmounts.length > 0) {
                        const poolSizeBigInt = market.optionAmounts.reduce(
                            (sum, amount) => sum + BigInt(amount.toString()), 
                            BigInt(0)
                        );
                        totalPool = ethers.formatEther(poolSizeBigInt);
                    }
                }

                console.log(`\nFound expired bet #${marketId}:`);
                console.log(`Description: ${market.description}`);
                console.log(`Expiration: ${new Date(Number(market.expirationDate) * 1000).toLocaleString()}`);
                console.log(`Total Pool: ${totalPool} ETH`);
                
                // Display options if available
                if (market.optionAmounts && market.optionAmounts.length > 0) {
                    console.log('Option amounts:');
                    for (let i = 0; i < market.optionAmounts.length; i++) {
                        const amount = ethers.formatEther(market.optionAmounts[i].toString());
                        console.log(`  Option ${i}: ${amount} ETH`);
                    }
                }
                
                // Ask for confirmation before proceeding
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const confirm = await new Promise(resolve => {
                    readline.question(`Do you want to request settlement for this bet? (y/n): `, answer => {
                        readline.close();
                        resolve(answer.toLowerCase() === 'y');
                    });
                });
                
                if (!confirm) {
                    console.log('Skipping this bet...');
                    continue;
                }
                
                try {
                    // Calculate reward and bond based on pool size
                    // Minimum values
                    let reward = ethers.parseEther("0.02");
                    let bond = ethers.parseEther("0.05");
                    
                    // For larger pools, increase the reward and bond
                    const poolSizeEth = parseFloat(totalPool);
                    if (poolSizeEth > 1.0) {
                        reward = ethers.parseEther("0.05");
                        bond = ethers.parseEther("0.1");
                    }
                    
                    const totalAmount = reward + bond;

                    console.log('Preparing settlement request...');
                    console.log(`Reward: ${ethers.formatEther(reward)} ETH`);
                    console.log(`Bond: ${ethers.formatEther(bond)} ETH`);
                    
                    // 1. Check WETH balance
                    const wethBalance = await wethContract.balanceOf(wallet.address);
                    console.log(`Current WETH balance: ${ethers.formatEther(wethBalance)} WETH`);
                    
                    if (wethBalance < totalAmount) {
                        // Need to wrap more ETH
                        const wrapAmount = totalAmount - wethBalance;
                        console.log(`Wrapping ${ethers.formatEther(wrapAmount)} ETH to WETH...`);
                        const wrapTx = await wethContract.deposit({ value: wrapAmount });
                        await wrapTx.wait();
                        console.log('ETH wrapped successfully');
                    } else {
                        console.log('Sufficient WETH balance available');
                    }
                    
                    // 2. Approve BettingContract to spend WETH
                    console.log('Approving BettingContract to spend WETH...');
                    const approveTx = await wethContract.approve(CONTRACT_ADDRESS, totalAmount);
                    await approveTx.wait();
                    console.log('Approval successful');

                    // 3. Request settlement
                    console.log('Requesting settlement...');
                    const tx = await contract.requestSettlement(
                        marketId,       // marketId
                        reward,         // reward amount
                        bond            // bond amount
                    );
                    
                    console.log('Transaction sent:', tx.hash);
                    console.log(`Track transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
                    
                    const receipt = await tx.wait();
                    if (receipt.status === 0) {
                        throw new Error('Transaction failed');
                    }
                    console.log('Settlement requested in block:', receipt.blockNumber);
                    
                    const verificationTime = Number(market.verificationTime);
                    console.log(`⏳ Waiting period (${verificationTime} seconds) has started`);
                    console.log(`Settlement can be executed after: ${new Date((currentTime + verificationTime) * 1000).toLocaleString()}`);
                    
                    processedCount++;

                } catch (err) {
                    console.error(`Error requesting settlement for bet #${marketId}:`, err.message || 'Unknown error');
                    
                    if (err.error?.data) {
                        try {
                            const iface = new ethers.Interface(BETTING_ABI);
                            const decodedError = iface.parseError(err.error.data);
                            if (decodedError) {
                                console.error('Decoded error:', decodedError.name, decodedError.args);
                            }
                        } catch (decodeErr) {
                            console.error('Failed to decode error:', decodeErr);
                        }
                    }
                }

                // Wait between transactions
                if (processedCount < markets.length) {
                    console.log('Waiting before processing next bet...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (!expiredBetsFound) {
            console.log('\nNo expired bets found that need settlement request.');
            console.log('Note: Only expired bets that haven\'t had settlement requested can be processed.');
        } else {
            console.log(`\nProcessed ${processedCount} expired bets.`);
        }

    } catch (err) {
        console.error('Error:', err.message || 'Unknown error');
        throw err;
    }
}

// Execute the script
requestSettlement()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });