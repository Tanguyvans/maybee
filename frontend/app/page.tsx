"use client";
import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../lib/dynamic";
import Image from "next/image";
import Button from "./components/Button";
import Link from "next/link";
import Spinner from "./Spinner";

export default function Main() {
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
      <h1 className="text-4xl font-bold mb-4">MayBee 🐝🐝</h1>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center">
            <div className="flex space-x-4">
              <Link href="/create">
                <Button>Create Bet</Button>
              </Link>
              <Link href="/placeBet">
                <Button>Place Bet</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? <Spinner /> : <DynamicWidget />}
        </div>
      </div>
    </div>
  );
}
