"use client";
import { useEffect, useState } from "react";
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "../../lib/dynamic";
import Spinner from "../Spinner";
import Create from '../components/Create';

export default function CreatePage() {
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
      {isLoading ? (
        <Spinner />
      ) : (
        <Create onBack={() => window.history.back()} />
      )}
      <div className="mt-6">
        <DynamicWidget />
      </div>
    </div>
  );
}