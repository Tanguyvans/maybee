import { useRouter } from "next/navigation";
import Button from "./Button";
import Card from "./Card";
import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import MAYBEE_ABI from '../abi/MayBee.json';

interface JoinProps {
  onBack: () => void;
  isWalletConnected: boolean;
  groupId: string | null;
}

interface Market {
  id: number;
  description: string;
  totalYesAmount: string;
  totalNoAmount: string;
  expirationDate: Date;
  isResolved: boolean;
  outcome: boolean;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Join({ onBack, isWalletConnected, groupId }: JoinProps) {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    if (isWalletConnected && groupId) {
      getMarketsForGroup();
    }
  }, [isWalletConnected, groupId]);

  const getMarketsForGroup = async () => {
    try {
      if (typeof window.ethereum !== 'undefined' && groupId) {
        console.log("Fetching markets for group:", groupId);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, MAYBEE_ABI, provider);
  
        const groupIdNumber = parseInt(groupId);
        console.log("Calling getMarketsForGroup with:", groupIdNumber);
        const marketIds = await contract.getMarketsForGroup(groupIdNumber);
        console.log("Received market IDs:", marketIds);
  
        const marketsData = await Promise.all(
          marketIds.map(async (id: number) => {
            console.log("Fetching info for market ID:", id);
            const marketInfo = await contract.getMarketInfo(id);
            console.log("Received market info:", marketInfo);
  
            // Fonction pour convertir la date d'expiration en objet Date
            const convertExpirationDate = (expDate: any) => {
              if (typeof expDate === 'number') {
                return new Date(expDate * 1000);
              } else if (expDate && typeof expDate.toNumber === 'function') {
                return new Date(expDate.toNumber() * 1000);
              } else if (expDate instanceof Date) {
                return expDate;
              } else {
                console.warn(`Unexpected expirationDate format for market ${id}:`, expDate);
                return new Date(); // Retourne la date actuelle comme fallback
              }
            };
  
            return {
              id,
              description: marketInfo.description,
              totalYesAmount: ethers.formatEther(marketInfo.totalYesAmount),
              totalNoAmount: ethers.formatEther(marketInfo.totalNoAmount),
              expirationDate: convertExpirationDate(marketInfo.expirationDate),
              isResolved: marketInfo.isResolved,
              outcome: marketInfo.outcome
            };
          })
        );
  
        console.log("Processed market data:", marketsData);
        setMarkets(marketsData);
      }
    } catch (error) {
      console.error("Error fetching market info:", error);
    }
  };

  const calculatePercentage = (yesAmount: string, noAmount: string) => {
    const yes = parseFloat(yesAmount);
    const no = parseFloat(noAmount);
    const total = yes + no;
    return total === 0 ? 0 : Math.round((yes / total) * 100);
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Join a Market</h2>
      <p>Group ID: {groupId || 'No group ID available'}</p> 
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
            isClickable={isWalletConnected && !market.isResolved}
          />
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