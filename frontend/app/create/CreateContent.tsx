"use client";

import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../../lib/dynamic";
import Spinner from "../Spinner";
import Create from "../components/Create";
import { useRouter } from "next/navigation";
import { useLaunchParams } from "@telegram-apps/sdk-react";

export default function CreateContent() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const lp = useLaunchParams();

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
    if (lp.startParam) {
      const [encodedGroupId] = lp.startParam.split("__");
      if (encodedGroupId) {
        try {
          const decodedGroupId = atob(encodedGroupId);
          console.log("Decoded Group ID:", decodedGroupId);
          setGroupId(decodedGroupId);
        } catch (error) {
          console.error("Error decoding group ID:", error);
        }
      } else {
        console.log("No group ID available in start_param");
      }
    } else {
      console.log("No start_param available");
    }
  }, [sdkHasLoaded, telegramSignIn, user, lp.startParam]);

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : ( 
        <>
          <Create onBack={() => router.push("/Home")} />
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