const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

interface UserBet {
    gameId: number;
    description: string;
    betAmount: string;
    position: 'YES' | 'NO';
    status: 'ACTIVE' | 'EXPIRED' | 'RESOLVED';
    outcome?: boolean;
    profit?: string;
    timestamp: Date;
    expirationDate: Date;
}

interface Log {
    topics: string[];
    data: string;
    blockNumber?: number;
    blockHash?: string;
    transactionHash?: string;
}

interface ParsedLog {
    args: {
        gameId: bigint;
        amount: bigint;
        isYes: boolean;
        timestamp: bigint;
    };
    name: string;
    signature: string;
    topic: string;
}

async function getUserBets(userAddress: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
            BETTING_ABI,
            provider
        );

        console.log(`\nFetching betting history for: ${userAddress}`);
        console.log('=====================================\n');

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        // Look back 10000 blocks (or adjust this number based on when your contract was deployed)
        const fromBlock = currentBlock - 10000;
        
        console.log(`Searching for events from block ${fromBlock} to ${currentBlock}`);

        // Get all BetPlaced events for this user
        const filter = contract.filters.BetPlaced(userAddress);
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        if (events.length === 0) {
            // Also try getting events by topic
            const betPlacedTopic = contract.interface.getEventTopic('BetPlaced');
            const logs: Log[] = await provider.getLogs({
                fromBlock: fromBlock,
                toBlock: currentBlock,
                address: contract.target,
                topics: [betPlacedTopic]
            });

            console.log(`Found ${logs.length} total betting events`);
            
            // Parse the logs to find matches
            const parsedLogs: (ParsedLog | null)[] = logs.map((log: Log) => {
                try {
                    return contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    }) as ParsedLog;
                } catch (e) {
                    return null;
                }
            });

            const validLogs = parsedLogs.filter((log): log is ParsedLog => log !== null);
            console.log(`Found ${validLogs.length} parsed betting events`);
            
            if (validLogs.length === 0) {
                console.log('No betting history found for this address.');
                console.log('Note: Make sure this is the address you used to place bets.');
                return;
            }
        }

        const userBets: UserBet[] = [];
        let totalBetAmount = 0;
        let totalProfit = 0;
        const currentTime = Math.floor(Date.now() / 1000);

        // Process each bet
        for (const event of events) {
            const { gameId, amount, isYes, timestamp } = event.args;
            const game = await contract.games(gameId);
            const betAmount = ethers.formatEther(amount);

            // Calculate profit if game is resolved
            let profit: string | undefined;
            if (game.isResolved) {
                const won = game.outcome === isYes;
                if (won) {
                    const totalPool = BigInt(game.totalYesAmount) + BigInt(game.totalNoAmount);
                    const winningPool = isYes ? BigInt(game.totalYesAmount) : BigInt(game.totalNoAmount);
                    const profitAmount = (BigInt(amount) * totalPool) / winningPool - BigInt(amount);
                    profit = ethers.formatEther(profitAmount);
                } else {
                    profit = `-${betAmount}`;
                }
            }

            // Determine bet status
            let status: UserBet['status'];
            if (game.isResolved) {
                status = 'RESOLVED';
            } else if (Number(game.expirationDate) <= currentTime) {
                status = 'EXPIRED';
            } else {
                status = 'ACTIVE';
            }

            userBets.push({
                gameId: Number(gameId),
                description: game.description,
                betAmount,
                position: isYes ? 'YES' : 'NO',
                status,
                outcome: game.isResolved ? game.outcome : undefined,
                profit,
                timestamp: new Date(Number(timestamp) * 1000),
                expirationDate: new Date(Number(game.expirationDate) * 1000)
            });

            totalBetAmount += parseFloat(betAmount);
            if (profit) {
                totalProfit += parseFloat(profit);
            }
        }

        // Display statistics
        console.log('📊 Betting Statistics:');
        console.log(`Total Bets Placed: ${userBets.length}`);
        console.log(`Total Amount Bet: ${totalBetAmount.toFixed(4)} ETH`);
        console.log(`Total Profit/Loss: ${totalProfit.toFixed(4)} ETH`);
        console.log(`Win Rate: ${((userBets.filter(bet => bet.profit && parseFloat(bet.profit) > 0).length / userBets.filter(bet => bet.status === 'RESOLVED').length) * 100).toFixed(1)}%\n`);

        // Display active bets
        const activeBets = userBets.filter(bet => bet.status === 'ACTIVE');
        if (activeBets.length > 0) {
            console.log('🎲 Active Bets:');
            activeBets.forEach(printBetDetails);
            console.log();
        }

        // Display pending settlements
        const expiredBets = userBets.filter(bet => bet.status === 'EXPIRED');
        if (expiredBets.length > 0) {
            console.log('⏳ Pending Settlement:');
            expiredBets.forEach(printBetDetails);
            console.log();
        }

        // Display resolved bets
        const resolvedBets = userBets.filter(bet => bet.status === 'RESOLVED');
        if (resolvedBets.length > 0) {
            console.log('✅ Resolved Bets:');
            resolvedBets.forEach(printBetDetails);
        }

    } catch (error) {
        console.error('Error fetching user bets:', error);
    }
}

function printBetDetails(bet: UserBet) {
    console.log(`\nBet #${bet.gameId}`);
    console.log(`Description: ${bet.description}`);
    console.log(`Position: ${bet.position}`);
    console.log(`Amount: ${bet.betAmount} ETH`);
    console.log(`Placed: ${bet.timestamp.toLocaleString()}`);
    console.log(`Expires: ${bet.expirationDate.toLocaleString()}`);
    
    if (bet.status === 'RESOLVED') {
        console.log(`Outcome: ${bet.outcome ? 'YES' : 'NO'}`);
        console.log(`Profit/Loss: ${bet.profit} ETH`);
    }
}

// If running directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 1) {
        console.log('Usage: npx ts-node scripts/getUserBets.ts <userAddress>');
        console.log('Example: npx ts-node scripts/getUserBets.ts 0x123...');
        process.exit(1);
    }

    getUserBets(args[0])
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

// Export for use as module
module.exports = getUserBets;