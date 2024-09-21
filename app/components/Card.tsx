import { useState } from 'react';

interface CardProps {
  id: number;
  title: string;
  optionA: string;
  optionB: string;
  percentageA: number;
  percentageB: number;
  totalBet: number;
}

export default function Card({ id, title, optionA, optionB, percentageA, percentageB, totalBet }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [betAmount, setBetAmount] = useState(0.1);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleBetSubmit = () => {
    console.log(`Bet placed on ${selectedOption} for ${betAmount} USDC`);
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg w-full max-w-sm cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Card content remains the same */}
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span>{optionA}</span>
              <span>{percentageA}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentageA}%` }}></div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span>{optionB}</span>
              <span>{percentageB}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${percentageB}%` }}></div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm">Total Bet: {totalBet} USDC</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="mb-4">
              <button
                className={`mr-2 px-4 py-2 rounded ${selectedOption === optionA ? 'bg-blue-600' : 'bg-gray-600'}`}
                onClick={() => handleOptionSelect(optionA)}
              >
                {optionA}
              </button>
              <button
                className={`px-4 py-2 rounded ${selectedOption === optionB ? 'bg-red-600' : 'bg-gray-600'}`}
                onClick={() => handleOptionSelect(optionB)}
              >
                {optionB}
              </button>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Bet Amount: {betAmount.toFixed(1)} USDC</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span>0.1 USDC</span>
                <span>10 USDC</span>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-600 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 rounded"
                onClick={handleBetSubmit}
                disabled={!selectedOption || betAmount < 0.1}
              >
                Place Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}