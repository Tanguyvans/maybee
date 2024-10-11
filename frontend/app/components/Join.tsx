import { useRouter } from "next/navigation";
import Button from "./Button";
import Card from "./Card";
import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import MAYBEE_ABI from '../abi/MayBee.json';

interface JoinProps {
  onBack: () => void;
  isWalletConnected: boolean;
}

interface Market {
  id: number;
  title: string;
  optionA: string;
  optionB: string;
  percentageA: number;
  percentageB: number;
  totalBet: number;
  expirationDate: number;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Join({ onBack, isWalletConnected }: JoinProps) {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    if (isWalletConnected) {
      getAllMarketInfo();
    }
  }, [isWalletConnected]);

  const getAllMarketInfo = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, MAYBEE_ABI, provider);

        const marketData = await contract.getAllMarkets();
        
        const formattedMarkets: Market[] = marketData.descriptions.map((desc: string, index: number) => ({
          id: index,
          title: desc,
          optionA: "Yes",
          optionB: "No",
          percentageA: calculatePercentage(marketData.totalYesAmounts[index], marketData.totalNoAmounts[index]),
          percentageB: calculatePercentage(marketData.totalNoAmounts[index], marketData.totalYesAmounts[index]),
          totalBet: Number(marketData.totalYesAmounts[index]) + Number(marketData.totalNoAmounts[index]),
          expirationDate: Number(marketData.expirationDates[index])
        }));

        setMarkets(formattedMarkets);
      }
    } catch (error) {
      console.error("Error fetching market info:", error);
    }
  };

  const calculatePercentage = (amount: ethers.BigNumberish, total: ethers.BigNumberish) => {
    const amountNum = Number(amount);
    const totalNum = Number(total);
    return totalNum === 0 ? 0 : Math.round((amountNum / (amountNum + totalNum)) * 100);
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Join a Market</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {markets.map((market) => (
          <Card key={market.id} {...market} isClickable={isWalletConnected} />
        ))}
      </div>
      <Button onClick={handleBack}>Back to Home</Button>
      {!isWalletConnected && (
        <p className="mt-4 text-yellow-400">
          Connect your wallet to interact with markets.
        </p>
      )}
    </div>
  );
}