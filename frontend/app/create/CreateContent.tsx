"use client";

declare global {
    interface Window {
      Telegram?: {
        WebApp: {
          initDataUnsafe: {
            start_param: string;
          };
        };
      };
    }
  }

import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../../lib/dynamic";
import Spinner from "../Spinner";
import Create from "../components/Create";
import { useRouter } from "next/navigation";

export default function CreateContent() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        await telegramSignIn({ forceCreateUser: true });
      }
      setIsLoading(false);
    };

    signIn();

    // Récupérer et décoder le groupId du paramètre de démarrage Telegram
    if (window.Telegram?.WebApp) {
      const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
      if (startParam) {
        try {
          const decodedGroupId = atob(startParam);
          console.log("Decoded Group ID:", decodedGroupId);
          setGroupId(decodedGroupId);
        } catch (error) {
          console.error("Error decoding group ID:", error);
        }
      } else {
        console.log("No start_param available");
      }
    }
  }, [sdkHasLoaded, telegramSignIn, user]);

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : ( 
        <>
          <Create onBack={() => router.push("/Home")}/>
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