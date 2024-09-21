"use client";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function Page() {
  const { address, isConnected, chain } = useAccount();
  useEffect(() => {}, [isConnected]);
  return (
    <>
      <p>wagmi connected: {isConnected ? "true" : "false"}</p>
      <p>wagmi address: {address}</p>
      <p>wagmi network: {chain?.id}</p>
      <p>Send to ETH address</p>

      <button type="submit">Send</button>
    </>
  );
}
