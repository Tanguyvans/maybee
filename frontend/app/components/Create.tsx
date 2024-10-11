import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import axios from "axios";
import { ethers } from "ethers";
import { sepolia } from 'wagmi/chains';

import MAYBEE_ABI from '../abi/MayBee.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Create({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask n'est pas installé ou n'est pas accessible");
      }
  
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("User address:", accounts[0]);
  
      // Utilisez BrowserProvider au lieu de Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Assurez-vous que l'utilisateur est sur le réseau Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(sepolia.id)) {
        throw new Error("Veuillez vous connecter au réseau Sepolia");
      }
  
      const signer = await provider.getSigner();
      console.log("Signer address:", await signer.getAddress());
  
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MAYBEE_ABI, signer);
  
      // Convert the expiration date to a Unix timestamp
      const expirationTimestamp = Math.floor(new Date(date).getTime() / 1000);
  
      // Call the createMarket function
      const tx = await contract.createMarket(title, expirationTimestamp);
      await tx.wait();
  
      console.log("Market created successfully!");
      alert("Market created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating market:", error);
      alert(`Error creating market: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-white">
        Create New Market
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Title
          </label>
          <textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            required
            placeholder="Enter market title"
            rows={3}
          />
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            End Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            required
          />
        </div>
        <div className="flex justify-between pt-4">
          <Button
            onClick={handleBack}
            className="bg-gray-600 hover:bg-gray-700 transition duration-150 ease-in-out"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Create Market
          </Button>
        </div>
      </form>
    </div>
  );
}
