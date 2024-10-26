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
  
  const lp = useLaunchParams();

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
          } else {
            console.log("No group ID available in start_param");
          }
        } else {
          console.log("No start_param available");
        }
      } catch (error) {
        console.error("Error in initializeComponent:", error);
        setError("An error occurred while initializing the component.");
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
          <Join onBack={() => window.history.back()} isWalletConnected={isWalletConnected} groupId={groupId} />
          <div className="mt-4 p-2 bg-gray-800 rounded">
            Telegram Group ID: {groupId ? groupId : "No group ID available"}
          </div>
        </>
      )}
      <div className="mt-6">
        <DynamicWidget />
      </div>
    </>
  );
}