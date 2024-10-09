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
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center">
            <Image src="/logo.png" alt="logo" width={100} height={100} />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">MayBee 🐝🐝</h1>
        <div className="flex space-x-4">
          <Link href="/Login" className="bg-[#FCE74E] rounded-lg">
            <Button className="bg-[#FCE74E] text-blue-950 hover:bg-[#decc46]">
              Login
            </Button>
          </Link>
          <Link href="/Signup" className="bg-[#56A33F] rounded-lg">
            <Button className="bg-[#56A33F] text-blue-100 hover:bg-[#488f32]">
              Signup
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
