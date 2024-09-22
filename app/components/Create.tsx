import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import axios from "axios";

export default function Create({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Creating new card:", { title, date });

    // Show success alert

    try {
      const response = await axios.post(
        "https://180d-223-255-254-102.ngrok-free.app/api/createmarket",
        {
          description: title,
        }
      ); // Change URL based on your backend server's URL
      console.log(response);
      alert("Market created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error fetching market info:", error);
      throw error; // Or handle it accordingly
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-white">
        Create New Market
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Title
          </label>
          <textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            required
            placeholder="Enter market title"
            rows={3}
          />
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            End Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            required
          />
        </div>
        <div className="flex justify-between pt-4">
          <Button
            onClick={handleBack}
            className="bg-gray-600 hover:bg-gray-700 transition duration-150 ease-in-out"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Create Market
          </Button>
        </div>
      </form>
    </div>
  );
}
