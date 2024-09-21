import { useRouter } from "next/navigation";

import Button from "./Button";
import Card from "./Card";
import axios from "axios";
import { useEffect, useState } from "react";

interface JoinProps {
  onBack: () => void;
  isWalletConnected: boolean;
}

// This would typically come from an API or database
const mockMarkets = [
  {
    id: 1,
    title: "Will Bitcoin reach $100k by end of 2025?",
    optionA: "Yes",
    optionB: "No",
    percentageA: 65,
    percentageB: 35,
    totalBet: 10000,
  },
  {
    id: 2,
    title: "Will Trump win the 2024 presidential election?",
    optionA: "Yes",
    optionB: "No",
    percentageA: 80,
    percentageB: 20,
    totalBet: 5000,
  },
  {
    id: 3,
    title: "Will FC Barcelona win La Liga?",
    optionA: "Yes",
    optionB: "No",
    percentageA: 40,
    percentageB: 60,
    totalBet: 5000,
  },
  {
    id: 4,
    title: "Will Trump win the 2024 presidential election?",
    optionA: "Yes",
    optionB: "No",
    percentageA: 80,
    percentageB: 20,
    totalBet: 5000,
  },
  // Add more mock markets as needed
];

export default function Join({ onBack, isWalletConnected }: JoinProps) {
  const router = useRouter();
  const [cardData, setCardData] = useState([]);
  const getAllMarketInfo = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/getAllMarketInfo"
      ); // Change URL based on your backend server's URL
      if (typeof response.data.data == "string") {
        let data = JSON.parse(response.data.data);
        setCardData(data);
      } else {
        setCardData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching market info:", error);
      throw error; // Or handle it accordingly
    }
  };
  useEffect(() => {
    getAllMarketInfo();
  }, []);
  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Join a Market</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {cardData &&
          cardData.map((market: any) => (
            <Card key={market.id} {...market} isClickable={isWalletConnected} />
          ))}
      </div>
      <Button onClick={handleBack}>Back to Home</Button>
      {!isWalletConnected && (
        <p className="mt-4 text-yellow-400">
          Connect your wallet to interact with markets.
        </p>
      )}
    </div>
  );
}
