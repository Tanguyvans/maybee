import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Connect to the Sepolia network
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Create a wallet instance
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Wallet address:", wallet.address);
  
  // Contract address
  const contractAddress = '0xffdd336f111dbd7ffcecb7b749e979af514c4397';
  
  // Token address (WETH on Sepolia)
  const tokenAddress = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
  
  // Amount to send (should be at least the reward amount)
  const amount = ethers.parseEther("0.01"); // Adjust this to match your reward
  
  // ERC20 token interface
  const tokenABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
  
  console.log("Checking token balance...");
  const balance = await tokenContract.balanceOf(wallet.address);
  console.log("Your token balance:", ethers.formatEther(balance), "WETH");
  
  if (balance < amount) {
    console.error("Insufficient token balance. You need to get some WETH first.");
    console.log("You can wrap ETH to get WETH using a DEX or faucet.");
    return;
  }
  
  console.log("Sending", ethers.formatEther(amount), "WETH to contract...");
  
  try {
    const tx = await tokenContract.transfer(contractAddress, amount);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Check the new balance of the contract
    const contractBalance = await tokenContract.balanceOf(contractAddress);
    console.log("Contract token balance:", ethers.formatEther(contractBalance), "WETH");
    
    console.log("Funding successful!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 