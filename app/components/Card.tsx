import { useState } from "react";
import { ethers } from 'ethers';
import BETTING_ABI from '../abi/BettingContract.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

interface CardProps {
  id: number;
  title: string;
  optionA: string;
  optionB: string;
  percentageA: number;
  percentageB: number;
  totalBet: number;
  expirationDate: Date;
  isClickable: boolean;
  onBetPlaced?: () => Promise<void>;
}

export default function Card({
  id,
  title,
  optionA,
  optionB,
  percentageA,
  percentageB,
  totalBet,
  expirationDate,
  isClickable,
  onBetPlaced
}: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [betAmount, setBetAmount] = useState(0.1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBetSubmit = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, BETTING_ABI, signer);

      // Convert bet amount to wei
      const betAmountWei = ethers.parseEther(betAmount.toString());

      // Determine if betting Yes or No
      const isYesBet = selectedOption === optionA;

      console.log("Placing bet:", {
        gameId: id,
        isYes: isYesBet,
        amount: betAmountWei.toString(),
      });

      // Call the placeBet function with value
      const tx = await contract.placeBet(
        id,
        isYesBet,
        { value: betAmountWei }
      );

      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      console.log("Transaction confirmed");
      alert("Bet placed successfully!");
      setIsModalOpen(false);
      
      // Call the refresh function after successful bet
      if (onBetPlaced) {
        await onBetPlaced();
      }
      
    } catch (err) {
      console.error("Error placing bet:", err);
      setError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    if (isClickable) {
      setIsModalOpen(true);
    } else {
      console.log("Please connect wallet to interact with this market");
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  return (
    <>
      <div 
        className={`bg-gray-800 rounded-lg p-4 ${isClickable ? 'cursor-pointer hover:bg-gray-700' : 'opacity-70'}`}
        onClick={handleCardClick}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="space-y-2">
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span>{optionA}</span>
              <span>{percentageA}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${percentageA}%` }}
              ></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span>{optionB}</span>
              <span>{percentageB}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full"
                style={{ width: `${percentageB}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Total Bet: {totalBet.toFixed(4)} ETH
          </div>
          <div className="text-sm text-gray-400">
            Expires: {expirationDate.toLocaleDateString()} {expirationDate.toLocaleTimeString()}
          </div>
        </div>
      </div>

     
      {isModalOpen && isClickable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            {error && (
              <div className="mb-4 p-2 bg-red-600 text-white rounded">
                {error}
              </div>
            )}
            <div className="mb-4">
              <button
                className={`mr-2 px-4 py-2 rounded ${
                  selectedOption === optionA ? "bg-blue-600" : "bg-gray-600"
                }`}
                onClick={() => handleOptionSelect(optionA)}
                disabled={isLoading}
              >
                {optionA}
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  selectedOption === optionB ? "bg-red-600" : "bg-gray-600"
                }`}
                onClick={() => handleOptionSelect(optionB)}
                disabled={isLoading}
              >
                {optionB}
              </button>
            </div>
            <div className="mb-4">
              <label className="block mb-2">
                Bet Amount: {betAmount.toFixed(3)} ETH
              </label>
              <input
                type="range"
                min="0.001"
                max="1"
                step="0.001"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full"
                disabled={isLoading}
              />
              <div className="flex justify-between text-sm mt-1">
                <span>0.001 ETH</span>
                <span>1 ETH</span>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  isLoading 
                    ? 'bg-gray-500' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
                onClick={handleBetSubmit}
                disabled={!selectedOption || isLoading}
              >
                {isLoading ? 'Placing Bet...' : 'Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}