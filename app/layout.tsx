"use client"; // Add this directive for the Client component

import "./globals.css";

import { Inter } from "next/font/google";
import {
  DynamicContextProvider,
  EthereumWalletConnectors,
} from "../lib/dynamic"; // Ensure client-side logic only
import { createConfig, http, WagmiProvider } from "wagmi";
import { flowTestnet } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const inter = Inter({ subsets: ["latin"] });

const dynamicEnvId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;

const config = createConfig({
  chains: [flowTestnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [flowTestnet.id]: http("https://testnet.evm.nodes.onflow.org"),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!dynamicEnvId) {
    const errMsg =
      "Please add your Dynamic Environment to this project's .env file";
    console.error(errMsg);
    throw new Error(errMsg);
  }

  return (
    <html lang="en">
      <DynamicContextProvider
        settings={{
          environmentId: dynamicEnvId,
          walletConnectors: [EthereumWalletConnectors],
        }}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <body className={inter.className}>{children}</body>
          </QueryClientProvider>
        </WagmiProvider>
      </DynamicContextProvider>
    </html>
  );
}
