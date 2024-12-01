"use client";
import { FC, FormEventHandler, useState } from "react";

import { parseEther } from "viem";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useAccount, useWriteContract } from "wagmi";

import abi from "./abi.json";
export default function Page() {
  const { primaryWallet } = useDynamicContext();

  const [txnHash, setTxnHash] = useState("");

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const address = formData.get("address") as string;
    const amount = formData.get("amount") as string;

    const publicClient = await primaryWallet.getPublicClient();
    const walletClient = await primaryWallet.getWalletClient();

    // const transaction: any = {
    //   to: address,
    //   value: amount ? parseEther(amount) : undefined,
    // };

    // const hash = await walletClient.sendTransaction(transaction);
    const [account] = await walletClient.getAddresses();

    const { request } = await publicClient.simulateContract({
      address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
      abi: abi,
      functionName: "getMarketInfo",
      args: [1],
      account,
    });
    let res = await walletClient.writeContract(request);
    console.log(res);
    // setTxnHash(hash);

    // const receipt = await publicClient.getTransactionReceipt({
    //   hash,
    // });

    // console.log(receipt);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <p>Send to ETH address</p>
      <input name="address" type="text" required placeholder="Address" />
      <input name="amount" type="text" required placeholder="0.05" />
      <button type="submit" className="p-10 bg-gray-300">
        Send
      </button>
      <span data-testid="transaction-section-result-hash">{txnHash}</span>
    </form>
  );
}
