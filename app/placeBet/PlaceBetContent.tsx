"use client";
import { useEffect, useState } from "react";
import { DynamicWidget, useTelegramLogin, useDynamicContext } from "../../lib/dynamic";
import Spinner from "../Spinner";
import Join from '../components/Join';
import { useLaunchParams } from "@telegram-apps/sdk-react";

export default function PlaceBetContent() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  let lp = null;
  try {
    lp = useLaunchParams();
  } catch (e) {
    console.log("App opened outside of Telegram");
  }

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const initializeComponent = async () => {
      try {
        if (!user) {
          await telegramSignIn({ forceCreateUser: true });
        }

        if (lp?.startParam) {
          const [encodedGroupId] = lp.startParam.split("__");
          if (encodedGroupId) {
            const decodedGroupId = atob(encodedGroupId);
            console.log("Decoded Group ID:", decodedGroupId);
            setGroupId(decodedGroupId);
          }
        }
      } catch (error) {
        console.error("Error in initializeComponent:", error);
        // Don't set error state for launch params issues
        if (error instanceof Error && !error.message.includes("launch parameters")) {
          setError("An error occurred while initializing the component.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [sdkHasLoaded, telegramSignIn, user, lp]);

  const isWalletConnected = !!user;

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Join 
            onBack={() => window.history.back()} 
            isWalletConnected={isWalletConnected} 
          />
          {groupId && (
            <div className="mt-4 p-2 bg-gray-800 rounded">
              Telegram Group ID: {groupId}
            </div>
          )}
        </>
      )}
      <div className="mt-6">
        <DynamicWidget />
      </div>
    </>
  );
}