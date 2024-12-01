'use client';

import Card from '@/app/components/Card';
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "@/lib/dynamic";
import { useEffect, useState } from "react";
import Spinner from "@/app/Spinner";

// This would typically come from an API or database
const mockMarkets1h = [
  {
    id: 1,
    title: 'Will Ethereum surpass $5k this month?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 40,
    percentageB: 60,
    totalBet: 5000,
  },
  // ... other markets for 1h
];

export default function Hottest1h() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  }, [sdkHasLoaded, telegramSignIn, user]);

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
        <h1 className="text-2xl font-bold mb-6">Hottest Markets (1H)</h1>
        {mockMarkets1h.map(market => (
          <Card key={market.id} {...market} isClickable={!!user} />
        ))}
        <div className="mt-6">
          <DynamicWidget />
        </div>
      </div>
    </div>
  );
}