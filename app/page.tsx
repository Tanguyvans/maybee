"use client";
import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../lib/dynamic";
import Image from 'next/image';
import Spinner from "./Spinner";
import Button from './components/Button';
import Link from 'next/link';

export default function Main() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'main' | 'create' | 'join'>('main');

  let val = "main";

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        await telegramSignIn({ forceCreateUser: true });
      }
      setIsLoading(false);
    };

    signIn();

    // Check for view parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      if (view === 'create' || view === 'join') {
        val = view;
        setCurrentView(view);
      }
    }
  }, [sdkHasLoaded, telegramSignIn, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center">
            <Image src="/logo.png" alt="logo" width={100} height={100} />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">MayBee 🐝🐝🐝 {val}</h1>
        <div className="flex space-x-4">
          <Link href="/create"><Button>Create</Button></Link>
          <Link href="/join"><Button>Join</Button></Link>
        </div>
        <div className="mt-6">
          {isLoading ? <Spinner /> : <DynamicWidget />}
        </div>
      </div>
    </div>
  );
}