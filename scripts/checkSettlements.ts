const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

interface ContractError {
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

interface BetStatus {
    id: number;
    description: string;
    expirationDate: Date;
    requestTime: number;
    totalPool: string;
    status: 'EXPIRED_NO_REQUEST' | 'WAITING_ORACLE' | 'READY_TO_SETTLE';
}

async function checkSettlements() {
    try {
        // Configuration
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC_URL;

        if (!CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        // Connect to the network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, provider);

        console.log('Checking bets status...');

        // Get the total number of games
        const gameCount = await contract.gameCount();
        const currentTime = Math.floor(Date.now() / 1000);
        const LIVENESS_PERIOD = 1800; // 30 minutes in seconds
        
        const betsNeedingAction: BetStatus[] = [];

        // Loop through all games
        for (let i = 1; i <= gameCount; i++) {
            const game = await contract.games(i);
            
            if (!game.isResolved && Number(game.expirationDate) <= currentTime) {
                const totalPool = ethers.formatEther(
                    BigInt(game.totalYesAmount) + BigInt(game.totalNoAmount)
                );

                let status: BetStatus['status'];
                if (Number(game.requestTime) === 0) {
                    status = 'EXPIRED_NO_REQUEST';
                } else if (currentTime < Number(game.requestTime) + LIVENESS_PERIOD) {
                    status = 'WAITING_ORACLE';
                } else {
                    status = 'READY_TO_SETTLE';
                }

                betsNeedingAction.push({
                    id: i,
                    description: game.description,
                    expirationDate: new Date(Number(game.expirationDate) * 1000),
                    requestTime: Number(game.requestTime),
                    totalPool: totalPool,
                    status
                });
            }
        }

        if (betsNeedingAction.length === 0) {
            console.log('\nNo bets need settlement.');
            return;
        }

        // Display results grouped by status
        console.log('\nBets Needing Action:');
        console.log('===================\n');

        // Group 1: Expired but no settlement requested
        const needRequest = betsNeedingAction.filter(bet => bet.status === 'EXPIRED_NO_REQUEST');
        if (needRequest.length > 0) {
            console.log('🚨 Needs Settlement Request:');
            needRequest.forEach(bet => printBetDetails(bet));
        }

        // Group 2: Waiting for Oracle period
        const waitingOracle = betsNeedingAction.filter(bet => bet.status === 'WAITING_ORACLE');
        if (waitingOracle.length > 0) {
            console.log('\n⏳ Waiting for Oracle Period:');
            waitingOracle.forEach(bet => {
                printBetDetails(bet);
                const timeLeft = (bet.requestTime + LIVENESS_PERIOD - currentTime);
                console.log(`   Time remaining: ${formatTimeLeft(timeLeft)}`);
            });
        }

        // Group 3: Ready to be settled
        const readyToSettle = betsNeedingAction.filter(bet => bet.status === 'READY_TO_SETTLE');
        if (readyToSettle.length > 0) {
            console.log('\n✅ Ready to Settle:');
            readyToSettle.forEach(bet => printBetDetails(bet));
        }

    } catch (error: unknown) {
        console.error('Error:', error);
        if (error && typeof error === 'object' && 'error' in error) {
            const contractError = error as ContractError;
            if (contractError.error) {
                console.error('Error details:', contractError.error);
            }
        }
    }
}

function printBetDetails(bet: BetStatus) {
    console.log(`\nBet #${bet.id}`);
    console.log(`   Description: ${bet.description}`);
    console.log(`   Expired: ${bet.expirationDate.toLocaleString()}`);
    console.log(`   Total Pool: ${bet.totalPool} ETH`);
    if (bet.requestTime > 0) {
        console.log(`   Settlement Requested: ${new Date(bet.requestTime * 1000).toLocaleString()}`);
    }
}

function formatTimeLeft(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
}

// Run the script
checkSettlements().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});