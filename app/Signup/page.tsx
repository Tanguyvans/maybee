"use client";
import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../../lib/dynamic";
import Image from "next/image";
import Spinner from "../Spinner";
import Link from "next/link";
import Button from "../components/Button";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Main() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState("");
  const router = useRouter();
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
  async function claimAccount(username: any) {
    const response = await axios.post(
      "https://180d-223-255-254-102.ngrok-free.app/api/claimAccount",
      {
        username,
      }
    ); // Change URL based on your backend server's URL
    console.log(response);
    setUserData(response.data.username);
    alert("Registration success");
    router.push("/Home");
  }
  useEffect(() => {
    if (user) {
      console.log(user.username);
      claimAccount(user.username);
    }
  }, [user]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">MayBee 🐝🐝</h1>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center">
            <div className="flex space-x-4 flex-col gap-10">
              Please signIn with telegram to register
              {isLoading ? <Spinner /> : <DynamicWidget />}
            </div>
          </div>
        </div>

        <div className="mt-6"></div>
      </div>
    </div>
  );
}
