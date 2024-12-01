import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import Card from "./Card";
import Button from "./Button";
import BETTING_ABI from '../abi/BettingContract.json';

interface Market {
  id: number;
  description: string;
  totalYesAmount: string;
  totalNoAmount: string;
  expirationDate: Date;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Join({ onBack, isWalletConnected }: { onBack: () => void, isWalletConnected: boolean }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActiveBets();
  }, []);

  const getActiveBets = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, BETTING_ABI, provider);

        const [activeGameIds, titles, expirationDates, totalYesAmounts, totalNoAmounts] = 
          await contract.getActiveBets();

        const marketsData = activeGameIds.map((id: bigint, index: number) => ({
          id: Number(id),
          description: titles[index],
          totalYesAmount: ethers.formatEther(totalYesAmounts[index]),
          totalNoAmount: ethers.formatEther(totalNoAmounts[index]),
          expirationDate: new Date(Number(expirationDates[index]) * 1000)
        }));

        console.log("Active bets:", marketsData);
        setMarkets(marketsData);
      }
    } catch (error) {
      console.error("Error fetching active bets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercentage = (yesAmount: string, noAmount: string) => {
    const yes = parseFloat(yesAmount);
    const no = parseFloat(noAmount);
    const total = yes + no;
    return total === 0 ? 50 : Math.round((yes / total) * 100);
  };

  const refreshMarkets = async () => {
    setIsLoading(true);
    await getActiveBets();
  };

  if (isLoading) {
    return <div className="text-center">Loading markets...</div>;
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Active Markets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {markets.map((market) => (
          <Card 
            key={market.id} 
            id={market.id}
            title={market.description}
            optionA="Yes"
            optionB="No"
            percentageA={calculatePercentage(market.totalYesAmount, market.totalNoAmount)}
            percentageB={calculatePercentage(market.totalNoAmount, market.totalYesAmount)}
            totalBet={parseFloat(market.totalYesAmount) + parseFloat(market.totalNoAmount)}
            expirationDate={market.expirationDate}
            isClickable={isWalletConnected}
            onBetPlaced={refreshMarkets}  // Add this prop
          />
        ))}
      </div>
      {markets.length === 0 && (
        <p className="text-center text-gray-400">No active bets available</p>
      )}
      <Button onClick={onBack}>Back to Home</Button>
      {!isWalletConnected && (
        <p className="mt-4 text-yellow-400">
          Connect your wallet to interact with markets.
        </p>
      )}
    </div>
  );
}