// scripts/getAllBets.js
const { ethers } = require('ethers');
const dotenv = require('dotenv');
const fs = require('fs');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function getAllBets() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            BETTING_ABI,
            provider
        );

        console.log('Fetching all bets history...');
        
        // Use getAllMarkets function to get all markets at once
        console.log('Using getAllMarkets function...');
        let bets = [];
        
        try {
            const allMarkets = await contract.getAllMarkets();
            console.log(`Successfully fetched ${allMarkets.length} markets`);
            
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Process each market
            bets = allMarkets.map(market => {
                const yesAmount = ethers.formatEther(market.totalYesAmount);
                const noAmount = ethers.formatEther(market.totalNoAmount);
                const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toFixed(6);
                
                let status;
                if (market.isResolved) {
                    status = 'RESOLVED';
                } else if (Number(market.expirationDate) <= currentTime) {
                    status = 'EXPIRED';
                } else {
                    status = 'ACTIVE';
                }
                
                return {
                    id: Number(market.marketId),
                    description: market.description,
                    creator: market.creator,
                    expirationDate: new Date(Number(market.expirationDate) * 1000),
                    isResolved: market.isResolved,
                    yesAmount,
                    noAmount,
                    totalPool,
                    outcome: market.isResolved ? market.outcome : undefined,
                    status,
                    category: getCategoryName(Number(market.category)),
                    imageUrl: market.imageUrl
                };
            });
            
        } catch (error) {
            console.error('Error using getAllMarkets:', error.message);
            console.log('Falling back to alternative method...');
            
            // Fallback to using getAllMarketIds and getMarketDetails
            bets = await getAllBetsAlternative(contract);
        }

        // Display statistics
        console.log('\n📊 Statistics:');
        console.log(`Total Bets Created: ${bets.length}`);
        console.log(`Active Bets: ${bets.filter(b => b.status === 'ACTIVE').length}`);
        console.log(`Expired Bets: ${bets.filter(b => b.status === 'EXPIRED').length}`);
        console.log(`Resolved Bets: ${bets.filter(b => b.status === 'RESOLVED').length}`);

        const totalPoolSize = bets.reduce((acc, bet) => acc + parseFloat(bet.totalPool), 0);
        console.log(`Total ETH in All Pools: ${totalPoolSize.toFixed(4)} ETH\n`);

        // Display all bets
        console.log('🎲 All Bets:');
        console.log('===========\n');

        bets.forEach(bet => {
            console.log(`Bet #${bet.id} [${bet.status}] - ${bet.category}`);
            console.log(`Description: ${bet.description}`);
            console.log(`Creator: ${bet.creator}`);
            console.log(`Expiration: ${bet.expirationDate.toLocaleString()}`);
            console.log(`YES Pool: ${bet.yesAmount} ETH`);
            console.log(`NO Pool: ${bet.noAmount} ETH`);
            console.log(`Total Pool: ${bet.totalPool} ETH`);
            if (bet.isResolved) {
                console.log(`Outcome: ${bet.outcome ? 'YES' : 'NO'}`);
            }
            console.log('-------------------\n');
        });
        
        // Save to JSON file
        fs.writeFileSync('allBets.json', JSON.stringify(bets, null, 2));
        console.log(`Saved ${bets.length} bets to allBets.json`);

    } catch (error) {
        console.error('Error fetching bets:', error);
    }
}

// Alternative method using getAllMarketIds and getMarketDetails
async function getAllBetsAlternative(contract) {
    console.log('Using getAllMarketIds and getMarketDetails...');
    
    const marketIds = await contract.getAllMarketIds();
    console.log(`Found ${marketIds.length} market IDs`);
    
    const currentTime = Math.floor(Date.now() / 1000);
    const bets = [];
    
    for (let i = 0; i < marketIds.length; i++) {
        const id = marketIds[i];
        try {
            console.log(`Fetching details for market #${id}...`);
            const details = await contract.getMarketDetails(id);
            
            const yesAmount = ethers.formatEther(details[6]);
            const noAmount = ethers.formatEther(details[7]);
            const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toFixed(6);
            
            let status;
            if (details[5]) { // isResolved
                status = 'RESOLVED';
            } else if (Number(details[3]) <= currentTime) { // expirationDate
                status = 'EXPIRED';
            } else {
                status = 'ACTIVE';
            }
            
            bets.push({
                id: Number(id),
                description: details[1],
                creator: details[2],
                expirationDate: new Date(Number(details[3]) * 1000),
                isResolved: details[5],
                yesAmount,
                noAmount,
                totalPool,
                outcome: details[5] ? details[9] : undefined,
                status,
                category: getCategoryName(Number(details[10])),
                imageUrl: details[11]
            });
        } catch (error) {
            console.error(`Error fetching market #${id}:`, error.message);
        }
    }
    
    return bets;
}

function getCategoryName(categoryNumber) {
    const categories = [
        'CULTURE',
        'CRYPTO',
        'SPORTS',
        'POLITICS',
        'MEMECOINS',
        'GAMING',
        'ECONOMY',
        'AI'
    ];
    
    return categories[categoryNumber] || `Unknown (${categoryNumber})`;
}

// Run the script
getAllBets()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });