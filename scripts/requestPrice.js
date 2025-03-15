// requestPrice.js
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Connect to the Sepolia network
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Create a wallet instance
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Wallet address:", wallet.address);
  
  // Contract address and ABI (only the functions we need)
  const contractAddress = '0xffdd336f111dbd7ffcecb7b749e979af514c4397';
  const contractABI = [{"inputs":[{"internalType":"address","name":"_OOV2","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_reward","type":"uint256"},{"internalType":"uint256","name":"_bond","type":"uint256"},{"internalType":"uint256","name":"_liveness","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"ancillaryData","type":"bytes"}],"name":"PriceRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"ancillaryData","type":"bytes"},{"indexed":false,"internalType":"int256","name":"price","type":"int256"}],"name":"PriceSettled","type":"event"},{"inputs":[],"name":"MULTIPLE_CHOICE_QUERY_ID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"OOV2","outputs":[{"internalType":"contract OptimisticOracleV2Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOO_EARLY_RESPONSE","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"bond","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"liveness","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"identifier","type":"bytes32"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"bytes","name":"ancillaryData","type":"bytes"},{"internalType":"int256","name":"price","type":"int256"}],"name":"priceSettled","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"_ancillaryData","type":"bytes"}],"name":"requestPrice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_bond","type":"uint256"}],"name":"reviseBond","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_liveness","type":"uint256"}],"name":"reviseLiveness","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_reward","type":"uint256"}],"name":"reviseReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"reviseToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"reward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}];
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  // Create the JSON object for ancillary data
  const ancillaryDataObj = {
    title: "NCAAB: Arizona Wildcats vs. Clemson Tigers",
    description: "In the upcoming NCAAB game, scheduled for March 28 at 7:09 PM ET:\nIf the Arizona Wildcats win, the market will resolve to \"Arizona\".\nIf the Clemson Tigers win, the market will resolve to \"Clemson\".",
    options: [
      ["Arizona", "0"],
      ["Clemson", "1"],
      ["Tie", "2"]
    ]
  };
  
  // Convert to JSON string
  const ancillaryDataJson = JSON.stringify(ancillaryDataObj);
  
  // Convert to bytes
  const ancillaryData = ethers.toUtf8Bytes(ancillaryDataJson);
  
  console.log("Ancillary data (JSON):", ancillaryDataJson);
  console.log("Sending requestPrice transaction...");
  
  try {
    // Call the requestPrice function
    const tx = await contract.requestPrice(ancillaryData);
    console.log("Transaction sent:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("Transaction successful!");
  } catch (error) {
    console.error("Error:", error);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });