const { ethers } = require('ethers');
const dotenv = require('dotenv');
const BETTING_ABI = require('../app/abi/BettingContract.json');

dotenv.config();

async function checkBetStatus(gameId: number) {
    try {
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const RPC_URL = process.env.SEPOLIA_RPC_URL;

        if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
            throw new Error('Missing environment variables');
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BETTING_ABI, wallet);

        const game = await contract.games(gameId);
        const currentTime = Math.floor(Date.now() / 1000);

        console.log('\nDetailed Status for Bet #' + gameId);
        console.log('Description:', game.description);
        console.log('Expiration:', new Date(Number(game.expirationDate) * 1000).toLocaleString());
        console.log('Current Time:', new Date(currentTime * 1000).toLocaleString());
        console.log('Is Expired:', currentTime >= Number(game.expirationDate));
        console.log('Is Resolved:', game.isResolved);
        console.log('Request Time:', game.requestTime > 0 ? new Date(Number(game.requestTime) * 1000).toLocaleString() : 'Not requested');
        console.log('\nConditions for Settlement Request:');
        console.log('1. Is Expired?', currentTime >= Number(game.expirationDate));
        console.log('2. Not Resolved?', !game.isResolved);
        console.log('3. Not Requested?', game.requestTime == 0);
        console.log('Can Request Settlement?', 
            currentTime >= Number(game.expirationDate) && 
            !game.isResolved && 
            game.requestTime == 0
        );
    } catch (error) {
        console.error('Error:', error);
    }
}

if (require.main === module) {
    const gameId = process.argv[2];
    if (!gameId) {
        console.log('Usage: npx ts-node scripts/checkBetStatus.ts <gameId>');
        process.exit(1);
    }
    checkBetStatus(parseInt(gameId))
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}