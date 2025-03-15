const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function placeBet(betDetails) {
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

        // Get market details
        console.log(`Fetching details for market #${betDetails.marketId}...`);
        
        let market;
        try {
            // Try to get market details using getMarketDetails
            const details = await contract.getMarketDetails(betDetails.marketId);
            
            // Convert BigInt arrays to string arrays to avoid mixing BigInt with other types
            const optionAmounts = details[6].map(amount => amount.toString());
            
            market = {
                description: details[1],
                expirationDate: details[3],
                isResolved: details[5],
                optionAmounts: optionAmounts,
                optionCount: Number(details[11]),
                category: Number(details[9])
            };
        } catch (error) {
            console.error('Error fetching market details:', error.message);
            throw new Error('Failed to fetch market details');
        }

        const currentTime = Math.floor(Date.now() / 1000);

        // Validate bet
        if (market.isResolved) {
            throw new Error('This market has already been resolved');
        }
        if (Number(market.expirationDate) <= currentTime) {
            throw new Error('This market has expired');
        }

        // Determine option index
        let optionIndex;
        if (betDetails.optionIndex !== undefined) {
            // If option index is directly provided
            optionIndex = betDetails.optionIndex;
        } else if (betDetails.isYes !== undefined) {
            // For backward compatibility with Yes/No markets
            optionIndex = betDetails.isYes ? 1 : 0;
        } else {
            throw new Error('Must provide either optionIndex or isYes');
        }

        // Validate option index
        if (optionIndex >= market.optionCount) {
            throw new Error(`Invalid option index. Market has ${market.optionCount} options (0-${market.optionCount-1})`);
        }

        const amountInWei = ethers.parseEther(betDetails.amount);

        // Get category name if available
        let categoryName = '';
        if (market.category !== undefined) {
            const categories = [
                'CULTURE', 'CRYPTO', 'SPORTS', 'POLITICS', 
                'MEMECOINS', 'GAMING', 'ECONOMY', 'AI'
            ];
            categoryName = categories[market.category] || `Category ${market.category}`;
        }

        // Display bet information
        console.log('\n🎲 Bet Details:');
        console.log('============');
        console.log(`Market ID: ${betDetails.marketId}`);
        console.log(`Description: ${market.description}`);
        if (categoryName) console.log(`Category: ${categoryName}`);
        console.log(`Option Index: ${optionIndex}`);
        console.log(`Amount: ${betDetails.amount} ETH`);
        console.log(`Expiration: ${new Date(Number(market.expirationDate) * 1000).toLocaleString()}`);
        console.log(`Time remaining: ${formatTimeRemaining(Number(market.expirationDate) - currentTime)}`);

        // Get current pool amounts
        const optionAmounts = market.optionAmounts.map(amount => ethers.formatEther(amount));
        const totalPool = optionAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
        
        console.log(`\n💰 Current Pool:`);
        for (let i = 0; i < optionAmounts.length; i++) {
            console.log(`Option ${i}: ${optionAmounts[i]} ETH (${calculatePercentage(optionAmounts[i], totalPool)}%)`);
        }
        console.log(`Total Pool: ${totalPool.toFixed(6)} ETH`);

        // Calculate potential winnings
        const platformFee = 0.03; // 3%
        const betAmountAfterFee = parseFloat(betDetails.amount) * (1 - platformFee);
        
        let potentialWinnings = 0;
        const totalLosingAmount = optionAmounts.reduce((sum, amount, i) => 
            i !== optionIndex ? sum + parseFloat(amount) : sum, 0);
            
        if (totalLosingAmount > 0) {
            const totalWinningAmount = parseFloat(optionAmounts[optionIndex]) + betAmountAfterFee;
            potentialWinnings = betAmountAfterFee + (betAmountAfterFee * totalLosingAmount / totalWinningAmount);
        } else {
            potentialWinnings = betAmountAfterFee;
        }
        
        console.log(`\n🏆 If you win, you could receive approximately: ${potentialWinnings.toFixed(6)} ETH`);
        console.log(`Potential profit: ${(potentialWinnings - parseFloat(betDetails.amount)).toFixed(6)} ETH`);

        // Ask for confirmation
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const confirm = await new Promise(resolve => {
            readline.question(`\nDo you want to place this bet? (y/n): `, answer => {
                readline.close();
                resolve(answer.toLowerCase() === 'y');
            });
        });
        
        if (!confirm) {
            console.log('Bet cancelled.');
            return;
        }

        // Place the bet
        console.log('\nPlacing bet...');
        
        let tx;
        if (betDetails.isYes !== undefined) {
            // Use placeBetYesNo for backward compatibility
            console.log('Using placeBetYesNo function...');
            tx = await contract.placeBetYesNo(
                betDetails.marketId,
                betDetails.isYes,
                { 
                    value: amountInWei,
                    gasLimit: 300000 
                }
            );
        } else {
            // Use placeBet with option index
            console.log('Using placeBet function...');
            tx = await contract.placeBet(
                betDetails.marketId,
                optionIndex,
                { 
                    value: amountInWei,
                    gasLimit: 300000 
                }
            );
        }

        console.log('Transaction sent:', tx.hash);
        console.log(`Track transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        console.log('Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Get updated market details
        const updatedDetails = await contract.getMarketDetails(betDetails.marketId);
        const updatedOptionAmounts = updatedDetails[6].map(amount => ethers.formatEther(amount.toString()));
        const updatedTotalPool = updatedOptionAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);

        console.log('\n💰 Updated Pool:');
        for (let i = 0; i < updatedOptionAmounts.length; i++) {
            console.log(`Option ${i}: ${updatedOptionAmounts[i]} ETH (${calculatePercentage(updatedOptionAmounts[i], updatedTotalPool)}%)`);
        }
        console.log(`Total Pool: ${updatedTotalPool.toFixed(6)} ETH`);

        // Get user's bet details
        const userBet = await contract.getUserBet(wallet.address, betDetails.marketId);
        console.log('\n🧾 Your Bets on This Market:');
        
        for (let i = 0; i < userBet[0].length; i++) {
            const amount = ethers.formatEther(userBet[0][i].toString());
            if (parseFloat(amount) > 0) {
                console.log(`Option ${i}: ${amount} ETH`);
            }
        }
        console.log(`Claimed: ${userBet[1] ? 'Yes' : 'No'}`);

        console.log('\n✅ Bet placed successfully!');

    } catch (error) {
        console.error('Error:', error.message || 'Unknown error');
        
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
}

// Helper function to calculate percentage
function calculatePercentage(part, total) {
    if (total <= 0) return '0.00';
    return ((parseFloat(part) / total) * 100).toFixed(2);
}

// Helper function to format time remaining
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Expired';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    
    return result.trim();
}

// If running directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    
    // Check if we're using the new format with option index or old format with isYes
    let betDetails;
    
    if (args.length === 3 && (args[1].toLowerCase() === 'true' || args[1].toLowerCase() === 'false')) {
        // Old format: marketId, isYes, amount
        console.log('Using Yes/No format (backward compatibility)');
        betDetails = {
            marketId: parseInt(args[0]),
            isYes: args[1].toLowerCase() === 'true',
            amount: args[2]
        };
        console.log('Usage: node scripts/placeBet.js <marketId> <isYes> <amount>');
    } else if (args.length === 3) {
        // New format: marketId, optionIndex, amount
        console.log('Using option index format');
        betDetails = {
            marketId: parseInt(args[0]),
            optionIndex: parseInt(args[1]),
            amount: args[2]
        };
        console.log('Usage: node scripts/placeBet.js <marketId> <optionIndex> <amount>');
    } else {
        console.log('Usage:');
        console.log('  For Yes/No markets: node scripts/placeBet.js <marketId> <true|false> <amount>');
        console.log('  For multiple choice markets: node scripts/placeBet.js <marketId> <optionIndex> <amount>');
        console.log('Examples:');
        console.log('  node scripts/placeBet.js 1 true 0.1  (Bet 0.1 ETH on YES for market #1)');
        console.log('  node scripts/placeBet.js 2 0 0.1     (Bet 0.1 ETH on option 0 for market #2)');
        process.exit(1);
    }

    placeBet(betDetails)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

// Export for use as module
module.exports = placeBet;