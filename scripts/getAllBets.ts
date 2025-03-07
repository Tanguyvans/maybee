const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

interface BetHistory {
    id: number;
    description: string;
    creator: string;
    expirationDate: Date;
    isResolved: boolean;
    yesAmount: string;
    noAmount: string;
    totalPool: string;
    outcome?: boolean;
    status: 'ACTIVE' | 'EXPIRED' | 'RESOLVED';
}

async function getAllBets() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
            BETTING_ABI,
            provider
        );

        const marketCount = await contract.marketCount();
        const currentTime = Math.floor(Date.now() / 1000);
        const bets: BetHistory[] = [];

        console.log('Fetching all bets history...\n');

        for (let i = 1; i <= marketCount; i++) {
            const market = await contract.markets(i);
            const yesAmount = ethers.formatEther(market.totalYesAmount);
            const noAmount = ethers.formatEther(market.totalNoAmount);
            const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toString();

            let status: BetHistory['status'];
            if (market.isResolved) {
                status = 'RESOLVED';
            } else if (Number(market.expirationDate) <= currentTime) {
                status = 'EXPIRED';
            } else {
                status = 'ACTIVE';
            }

            bets.push({
                id: i,
                description: market.description,
                creator: market.creator,
                expirationDate: new Date(Number(market.expirationDate) * 1000),
                isResolved: market.isResolved,
                yesAmount,
                noAmount,
                totalPool,
                outcome: market.isResolved ? market.outcome : undefined,
                status
            });
        }

        // Display statistics
        console.log('📊 Statistics:');
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
            console.log(`Bet #${bet.id} [${bet.status}]`);
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

    } catch (error) {
        console.error('Error fetching bets:', error);
    }
}

// Run the script
getAllBets().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});