"use client";
import { useEffect, useState } from "react";
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "../../lib/dynamic";
import Spinner from "../Spinner";
import Join from '../components/Join';

export default function JoinPage() {
  const { sdkHasLoaded, user, primaryWallet } = useDynamicContext();
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

  const isWalletConnected = !!primaryWallet;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col text-white">
      <div className="flex-grow overflow-auto pb-24">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="h-full overflow-y-auto py-4">
            <Join onBack={() => window.history.back()} isWalletConnected={isWalletConnected} />
          </div>
        )}
      </div>
      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-gray-900 to-transparent h-24">
        <DynamicWidget />
      </div>
    </div>
  );
}