import { useRouter } from 'next/navigation';

import Button from './Button';
import Card from './Card';

interface JoinProps {
  onBack: () => void;
}

// This would typically come from an API or database
const mockMarkets = [
  {
    id: 1,
    title: 'Will Bitcoin reach $100k by end of 2023?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 65,
    percentageB: 35,
    totalBet: 10000,
  },
  {
    id: 2,
    title: 'Will Ethereum 2.0 launch before July 2023?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 80,
    percentageB: 20,
    totalBet: 5000,
  },
  {
    id: 3,
    title: 'Will Ethereum 2.0 launch before July 2023?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 80,
    percentageB: 20,
    totalBet: 5000,
  },
  {
    id: 4,
    title: 'Will Ethereum 2.0 launch before July 2023?',
    optionA: 'Yes',
    optionB: 'No',
    percentageA: 80,
    percentageB: 20,
    totalBet: 5000,
  },
  // Add more mock markets as needed
];

export default function Join({ onBack }: JoinProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };  

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Join a Market</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {mockMarkets.map((market) => (
          <Card key={market.id} {...market} isClickable={true} />
        ))}
      </div>
      <Button onClick={handleBack}>Back to Home</Button>
    </div>
  );
}