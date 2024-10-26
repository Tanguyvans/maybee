"use client";
import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../../lib/dynamic";
import Spinner from "../Spinner";
import Create from "../components/Create";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreatePage() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        await telegramSignIn({ forceCreateUser: true });
      }
      setIsLoading(false);
    };

    signIn();

    // Récupérer le chatId des paramètres de l'URL
    const chatIdFromUrl = searchParams.get('chatId');
    setChatId(chatIdFromUrl);
  }, [sdkHasLoaded, telegramSignIn, user, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Create onBack={() => router.push("/Home")} />
          {chatId && (
            <div className="mt-4 p-2 bg-gray-800 rounded">
              Telegram Group ID: {chatId}
            </div>
          )}
        </>
      )}
      <div className="mt-6">
        <DynamicWidget />
      </div>
    </div>
  );
}