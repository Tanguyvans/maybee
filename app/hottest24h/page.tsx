'use client';

import Card from '@/app/components/Card';
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "@/lib/dynamic";
import { useEffect, useState } from "react";
import Spinner from "@/app/Spinner";
import { ethers } from 'ethers';
import BETTING_ABI from '../abi/BettingContract.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

interface Market {
  id: number;
  description: string;
  totalYesAmount: string;
  totalNoAmount: string;
  expirationDate: Date;
}

export default function Hottest24h() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      try {
        if (!user) {
          await telegramSignIn({ forceCreateUser: true });
        }
      } catch (error) {
        console.error("Sign-in failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    signIn();
    getActiveBets();
  }, [sdkHasLoaded, telegramSignIn, user]);

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

        setMarkets(marketsData);
      }
    } catch (error) {
      console.error("Error fetching active bets:", error);
    }
  };

  const calculatePercentage = (yesAmount: string, noAmount: string) => {
    const yes = parseFloat(yesAmount);
    const no = parseFloat(noAmount);
    const total = yes + no;
    return total === 0 ? 50 : Math.round((yes / total) * 100);
  };

  const refreshMarkets = async () => {
    await getActiveBets();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <div className="container mx-auto p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Hottest Markets (24H)</h1>
        {markets.map(market => (
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
            isClickable={!!user}
            onBetPlaced={refreshMarkets}
          />
        ))}
        <div className="mt-6">
          <DynamicWidget />
        </div>
      </div>
    </div>
  );
}