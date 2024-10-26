"use client";
import { useEffect, useState } from "react";
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "../../lib/dynamic";
import Spinner from "../Spinner";
import Join from '../components/Join';
import { useLaunchParams } from "@telegram-apps/sdk-react";

export default function JoinPage() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const lp = useLaunchParams();

  useEffect(() => {
    setIsClient(true);
    
    if (lp?.startParam) {
      const [encodedGroupId] = lp.startParam.split("__");
      if (encodedGroupId) {
        const decodedGroupId = atob(encodedGroupId);
        console.log("Decoded Group ID:", decodedGroupId);
        setGroupId(decodedGroupId);
      } else {
        console.log("No group ID available in start_param");
      }
    } else {
      console.log("No start_param available");
    }
  }, [lp]);

  useEffect(() => {
    if (!sdkHasLoaded || !isClient) return;

    const initializeComponent = async () => {
      try {
        if (!user) {
          await telegramSignIn({ forceCreateUser: true });
        }
      } catch (error) {
        console.error("Error in initializeComponent:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [sdkHasLoaded, telegramSignIn, user, isClient]);

  const isWalletConnected = !!user;

  if (!isClient) {
    return null; // ou un placeholder pour le rendu côté serveur
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col text-white">
      <div className="flex-grow overflow-auto pb-24">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="h-full overflow-y-auto py-4">
            <Join onBack={() => window.history.back()} isWalletConnected={isWalletConnected} groupId={groupId} />
          </div>
        )}
      </div>
      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-gray-900 to-transparent h-24">
        <DynamicWidget />
      </div>
    </div>
  );
}