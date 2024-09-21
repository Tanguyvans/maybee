import Button from './Button';

export default function Create({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create</h2>
      {/* Create form or content here */}
      <Button onClick={onBack}>Back</Button>
    </div>
  );
}