import { useRouter } from 'next/navigation';
import Button from './Button';

export default function Create({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create</h2>
      {/* Create form or content here */}
      <Button onClick={handleBack}>Back</Button>
    </div>
  );
}