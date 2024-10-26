import { Suspense } from "react";
import CreateContent from "./CreateContent";
import Spinner from "../Spinner";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
      <Suspense fallback={<Spinner />}>
        <CreateContent />
      </Suspense>
    </div>
  );
}