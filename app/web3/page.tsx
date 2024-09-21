// components/ClientOnly.jsx
"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function ClientOnly() {
  const { address, isConnected, chain } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bold">
      wagmi connected: {isConnected ? "true" : "false"}
      wagmi address: {address}
      wagmi network: {chain?.id}
    </div>
  );
}
