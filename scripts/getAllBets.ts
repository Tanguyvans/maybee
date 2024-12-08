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

        const gameCount = await contract.gameCount();
        const currentTime = Math.floor(Date.now() / 1000);
        const bets: BetHistory[] = [];

        console.log('Fetching all bets history...\n');

        for (let i = 1; i <= gameCount; i++) {
            const game = await contract.games(i);
            const yesAmount = ethers.formatEther(game.totalYesAmount);
            const noAmount = ethers.formatEther(game.totalNoAmount);
            const totalPool = (parseFloat(yesAmount) + parseFloat(noAmount)).toString();

            let status: BetHistory['status'];
            if (game.isResolved) {
                status = 'RESOLVED';
            } else if (Number(game.expirationDate) <= currentTime) {
                status = 'EXPIRED';
            } else {
                status = 'ACTIVE';
            }

            bets.push({
                id: i,
                description: game.description,
                creator: game.creator,
                expirationDate: new Date(Number(game.expirationDate) * 1000),
                isResolved: game.isResolved,
                yesAmount,
                noAmount,
                totalPool,
                outcome: game.isResolved ? game.outcome : undefined,
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