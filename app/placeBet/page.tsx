import dynamic from 'next/dynamic';
import Spinner from "../Spinner";

const PlaceBetContent = dynamic(() => import("./PlaceBetContent"), {
  loading: () => <Spinner />,
  ssr: false
});

export default function PlaceBetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <PlaceBetContent />
    </div>
  );
}