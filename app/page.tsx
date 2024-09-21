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
import Create from './components/Create';
import Join from './components/Join';

export default function Main() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'main' | 'create' | 'join'>('main');

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
      <div className="flex flex-col items-center justify-center text-center">
        {currentView === 'main' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center">
                <Image src="/logo.png" alt="logo" width={100} height={100} />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">MayBee 🐝🐝🐝</h1>
            <div className="flex space-x-4">
              <Button onClick={() => setCurrentView('create')}>Create</Button>
              <Button onClick={() => setCurrentView('join')}>Join</Button>
            </div>
            <div className="mt-6">
              {isLoading ? <Spinner /> : <DynamicWidget />}
            </div>
          </>
        )}
        
        {currentView === 'create' && (
          <Create onBack={() => setCurrentView('main')} />
        )}
        
        {currentView === 'join' && (
          <Join onBack={() => setCurrentView('main')} />
        )}

      </div>
    </div>
  );
}