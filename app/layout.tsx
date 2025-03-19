"use client";
import "./globals.css";

import { Inter } from "next/font/google";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { flowMainnet } from "viem/chains";

const inter = Inter({ subsets: ["latin"] });

const dynamicEnvId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;

const config = createConfig({
  chains: [flowMainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [flowMainnet.id]: http(),
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
      {/* <DynamicContextProvider
        settings={{
          environmentId: dynamicEnvId,
          walletConnectors: [EthereumWalletConnectors],
        }}
      > */}
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {/* <DynamicWagmiConnector> */}
          <body className={inter.className}>{children}</body>
          {/* </DynamicWagmiConnector> */}
        </QueryClientProvider>
      </WagmiProvider>
      {/* </DynamicContextProvider> */}
    </html>
  );
}
