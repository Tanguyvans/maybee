import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import { ethers } from "ethers";
import { sepolia } from 'wagmi/chains';

import MAYBEE_ABI from '../abi/BettingContract.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

interface CreateProps {
  onBack: () => void;
  groupId: string | null;
}

export default function Create({ onBack, groupId }: CreateProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId) {
      alert("No Telegram group ID available. Cannot create market.");
      return;
    }

    setIsLoading(true);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask n'est pas installé ou n'est pas accessible");
      }
  
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(sepolia.id)) {
        throw new Error("Veuillez vous connecter au réseau Sepolia");
      }
  
      const signer = await provider.getSigner();
      console.log("Signer address:", await signer.getAddress());
  
      const contract = new ethers.Contract(CONTRACT_ADDRESS as string, MAYBEE_ABI, signer);
  
      const expirationTimestamp = Math.floor(new Date(date).getTime() / 1000);
  
      // Use the Telegram groupId when creating the market
      const tx = await contract.createMarket(title, expirationTimestamp, BigInt(groupId));
      await tx.wait();
  
      alert("Market created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating market:", error);
      alert(`Error creating market: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Market"}
          </Button>
        </div>
      </form>
      {groupId && (
        <div className="mt-4 text-sm text-gray-400">
          Creating market for Telegram group: {groupId}
        </div>
      )}
    </div>
  );
}