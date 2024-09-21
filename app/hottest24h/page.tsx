'use client';

import Card from '@/app/components/Card';
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "@/lib/dynamic";
import { useEffect, useState } from "react";
import Spinner from "@/app/Spinner";

// This would typically come from an API or database
const mockMarkets24h = [
  {
    id: 1,
    title: 'Will Bitcoin reach $100k by end of 2023?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 65,
    percentageB: 35,
    totalBet: 10000,
  },
  // ... other markets for 24h
];

export default function Hottest24h() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        await telegramSignIn({ forceCreateUser: true });
      }
      setIsLoading(false);
    };

    signIn();
  }, [sdkHasLoaded, telegramSignIn, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <div className="container mx-auto p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Hottest Markets (24H)</h1>
        {mockMarkets24h.map(market => (
          <Card key={market.id} {...market} />
        ))}
        <div className="mt-6">
          {isLoading ? <Spinner /> : <DynamicWidget />}
        </div>
      </div>
    </div>
  );
}