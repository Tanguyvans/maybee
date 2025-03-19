"use client";
import { useEffect, useState, useRef } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../lib/dynamic";
import Image from "next/image";
import Button from "./components/Button";
import Link from "next/link";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ethers } from "ethers";
import contractABI from "./abi/Maybeebets.json";
import { styles } from "./components/styles";
// Add this interface near the top of your file, after your imports
interface Market {
  marketId: any;
  description: string;
  totalYesAmount: any;
  totalNoAmount: any;
  expirationDate: any;
  category: number;
  imageUrl: string;
}

// Add this interface after your Market interface
interface FormattedMarket {
  id: any;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  liquidity: string;
  category: string;
  image: string;
  expirationDate: number;
}

export default function Main() {
  // const { sdkHasLoaded, user, setShowAuthFlow } = useDynamicContext();
  // const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const blur = useTransform(scrollYProgress, [0, 0.5], [0, 5]);

  // Vibrant theme colors
  const colorScheme = {
    primary: "#EBFE06",
    secondary: "#5BAD36",
    cardBg: "#D1D5DB",
    text: "#161616",
  };
  const [isHovering, setIsHovering] = useState(false);

  // Contract address and ABI
  const contractAddress = "0x8D92868b31d319A474c5227c39bd4CF9e46f7890";

  // Prediction markets state
  const [predictionMarkets, setPredictionMarkets] = useState<FormattedMarket[]>(
    []
  );

  const categories = [
    "All",
    "Memecoins",
    "NFTs",
    "Politics",
    "Social",
    "Gaming",
  ];
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch markets from contract
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Connect to Sepolia network
        const provider = new ethers.JsonRpcProvider(
          "https://eth-sepolia.g.alchemy.com/v2/cPHvkx7E0X7ByCKeHURgmERGTUJoyzHR"
        );
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          provider
        );

        // Call getAllMarkets function
        const markets = await contract.getAllMarkets();

        if (markets && markets.length > 0) {
          // Transform contract data to our UI format
          const formattedMarkets = markets.map((market: Market) => {
            const totalBets =
              parseFloat(ethers.formatEther(market.totalYesAmount)) +
              parseFloat(ethers.formatEther(market.totalNoAmount));

            const yesPercentage =
              totalBets > 0
                ? Math.round(
                    (parseFloat(ethers.formatEther(market.totalYesAmount)) /
                      totalBets) *
                      100
                  )
                : 50;

            const noPercentage = 100 - yesPercentage;

            // Map category enum to string (0 = Memecoins, 1 = NFTs, etc.)
            const categoryMap = [
              "Memecoins",
              "NFTs",
              "Politics",
              "Social",
              "Gaming",
            ];
            const categoryString = categoryMap[market.category] || "Other";
            const expirationDate = new Date(
              Number(market.expirationDate) * 1000
            );

            return {
              id: market.marketId,
              title: market.description,
              yesPercentage,
              noPercentage,
              expirationDate: expirationDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              liquidity: `${ethers.formatEther(
                BigInt(market.totalYesAmount) + BigInt(market.totalNoAmount)
              )} ETH`,
              category: categoryString,
              image: market.imageUrl || `/images/pepe-coin.png`, // Fallback image if none provided
            };
          });

          setPredictionMarkets(formattedMarkets);
        }
      } catch (error) {
        console.error("Error fetching markets:", error);
        // Keep default markets if there's an error
      }
    };

    fetchMarkets();
  }, []);

  // useEffect(() => {
  //   if (!sdkHasLoaded) return;

  //   const signIn = async () => {
  //     if (!user) {
  //       await telegramSignIn({ forceCreateUser: true });
  //     }
  //     setIsLoading(false);
  //   };

  //   signIn();
  // }, [sdkHasLoaded, telegramSignIn, user]);

  // Custom Bee Loader Component
  const BeeLoader = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-80">
        <motion.div
          className="relative"
          animate={{
            rotate: [0, 10, -10, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="w-24 h-24 relative"
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Bee Loading"
              fill
              className="object-contain rounded-full"
            />
          </motion.div>
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-[#EBFE06] rounded-full opacity-30"
            animate={{
              width: [64, 48, 64],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
        <motion.p
          className="absolute mt-32 text-xl font-dmsans text-[#161616]"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Buzzing in...
        </motion.p>
      </div>
    );
  };

  if (isLoading) {
    return <BeeLoader />;
  }

  return (
    <div className="min-h-screen text-[#161616] overflow-hidden bg-white">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-white shadow-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/images/logo.png"
                alt="Maybee Markets 🐝"
                width={60}
                height={60}
                className="mr-2 rounded-full"
              />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold font-dmsans text-[#EBFE06]"
              whileHover={{ scale: 1.05 }}
              style={{
                textShadow: `
                  -1px -1px 0 #161616,
                  1px -1px 0 #161616,
                  -1px 1px 0 #161616,
                  1px 1px 0 #161616
                `,
              }}
            >
              Maybee
            </motion.h1>
          </motion.div>
          <div className="flex items-center space-x-4">
            <button className="bg-[#EBFE06] hover:bg-opacity-90 text-[#161616] font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <p className="flex text-[16px] font-[600]">Login / Signup</p>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        className="py-16 bg-gradient-to-br from-white via-[#f8f8ff] to-[#f0f0ff] relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              className="md:w-1/2 mb-10 md:mb-0"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-dmsans leading-tight">
                Predict the Future,{" "}
                <span className="text-[#5BAD36]">Earn Rewards</span>
              </h1>
              <p className="text-xl mb-8 text-gray-700 font-dmsans">
                Join the hive mind and trade on the outcomes of future events
                with Maybee Markets.
              </p>
              <motion.button
                className="bg-[#EBFE06] text-[#161616] font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Trading Now
              </motion.button>
            </motion.div>
            <motion.div
              className="md:w-1/2 relative"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                className="relative h-80 w-80 mx-auto"
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Maybee Illustration"
                  fill
                  className="object-contain"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-[#EBFE06] opacity-20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-[#5BAD36] opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </motion.section>

      {/* Category Filter */}
      <motion.section
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <motion.h3
          className="text-3xl font-bold mb-6 font-dmsans text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Explore <span className="text-[#5BAD36]">Hives</span>
        </motion.h3>

        <div className="flex overflow-x-auto py-4 scrollbar-hide relative justify-center">
          <div className="flex space-x-3">
            {categories.map((category) => (
              <motion.button
                className={`px-6 py-3 rounded-full text-[#161616] font-bold transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-[#EBFE06] shadow-md"
                    : "bg-[#A39EFF] text-[#f3f2ff] hover:bg-[#EBFE06] hover:text-[#161616]"
                }`}
                onClick={() => setActiveCategory(category)}
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Markets Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {predictionMarkets
              .filter(
                (market) =>
                  activeCategory === "All" || market.category === activeCategory
              )
              .map((market, index) => (
                <motion.div
                  key={market.id}
                  className="rounded-xl overflow-hidden relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                  style={{
                    background: "#161616",
                    color: "#EBFE06",
                    borderRadius: "16px",
                  }}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img
                        src={market.image}
                        alt={market.title}
                        className="w-full h-full object-cover transition-transform duration-500"
                      />
                    </motion.div>
                    <motion.div
                      className="absolute top-4 right-4 bg-[#EBFE06] px-4 py-2 rounded-full shadow-md"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-sm font-bold text-[#161616]">
                        {market.category}
                      </span>
                    </motion.div>
                  </div>
                  <div className="p-6">
                    <motion.h4
                      className="text-xl font-bold mb-4 font-dmsans text-[#EBFE06]"
                      whileHover={{ scale: 1.01 }}
                    >
                      {market.title}
                    </motion.h4>

                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <motion.span
                          className="flex items-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.div className="w-4 h-4 rounded-full mr-2 bg-[#EBFE06]"></motion.div>
                          <span className="font-dmsans text-[#EBFE06]">
                            Based: {market.yesPercentage}%
                          </span>
                        </motion.span>
                        <motion.span
                          className="flex items-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.div className="w-4 h-4 rounded-full mr-2 bg-[#A39EFF]"></motion.div>
                          <span className="font-dmsans text-[#A39EFF]">
                            Cringe: {market.noPercentage}%
                          </span>
                        </motion.span>
                      </div>
                      <div className="w-full bg-[#A39EFF] rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-4 bg-[#EBFE06]"
                          style={{
                            width: `${market.yesPercentage}%`,
                          }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${market.yesPercentage}%` }}
                          transition={{
                            duration: 1.5,
                            delay: 0.2,
                            type: "spring",
                            stiffness: 50,
                          }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <motion.span
                          className="text-sm font-bold font-dmsans text-[#EBFE06]"
                          whileHover={{ scale: 1.05 }}
                        >
                          {market.liquidity}
                        </motion.span>
                        <motion.span className="text-xs font-dmsans text-[#EBFE06] opacity-70">
                          Expires: {market.expirationDate}
                        </motion.span>
                      </div>
                      <Link href={`/market/${market.id}`}>
                        <motion.button
                          className="bg-[#EBFE06] text-[#161616] font-bold py-2 px-6 rounded-full shadow-md"
                          whileHover={{
                            scale: 1.05,
                            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Trade Now
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </section>

      {/* How It Works Section */}
      <motion.section
        className="py-16 relative overflow-hidden bg-gradient-to-br from-[#f8f8ff] to-[#f0f0ff]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.h3
            className="text-4xl font-bold text-center mb-12 font-dmsans"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            How To <span className="text-[#5BAD36]">Get Rich</span>
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: "/images/pepe-wallet.png",
                title: "Connect Wallet",
                desc: "Link your wallet and join the Pepe army",
              },
              {
                image: "/images/pepe-trade.png",
                title: "Pick Winners",
                desc: "Use your galaxy brain to predict the future",
              },
              {
                image: "/images/pepe-rich.png",
                title: "Get Rich",
                desc: "Stack them gains and flex on normies",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-8 rounded-2xl relative z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.3,
                  type: "spring",
                }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                }}
                style={{
                  background: index % 2 === 0 ? "#D1D5DB" : "#5BAD36",
                  borderRadius: "16px",
                }}
              >
                <motion.div
                  className="relative w-40 h-40 mb-8"
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </motion.div>
                <motion.h4 className="text-2xl font-bold mb-3 font-dmsans text-[#161616]">
                  {item.title}
                </motion.h4>
                <motion.p className="text-lg font-dmsans text-[#161616] opacity-80">
                  {item.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-40 right-10 w-24 h-24 rounded-full bg-[#EBFE06] opacity-20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-[#5BAD36] opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-16 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <motion.h3
            className="text-4xl font-bold text-center mb-12 font-dmsans"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Market <span className="text-[#5BAD36]">Stats</span>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "$2.4M", label: "Total Volume" },
              { value: "12,450", label: "Active Traders" },
              { value: "98%", label: "Resolved Markets" },
              { value: "24/7", label: "Market Hours" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-[#D1D5DB] to-[#5BAD36] p-8 rounded-2xl text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                }}
              >
                <motion.div
                  className="text-4xl font-bold mb-2 font-dmsans text-[#161616]"
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <motion.div className="text-lg font-dmsans text-[#161616] opacity-80">
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="relative overflow-hidden py-12 bg-gradient-to-br from-[#f8f8ff] to-[#f0f0ff]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <motion.div
              className="flex items-center mb-6 md:mb-0"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="rounded-full"
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Maybee Logo"
                  width={70}
                  height={70}
                  className="mr-3 rounded-full"
                />
              </motion.div>
              <motion.h1 className="text-3xl font-bold font-dmsans text-[#5BAD36]">
                Maybee
              </motion.h1>
            </motion.div>
            <div className="flex space-x-8">
              {[
                { icon: "/images/social/twitter.svg", alt: "Twitter" },
                { icon: "/images/social/telegram.svg", alt: "Telegram" },
                { icon: "/images/social/discord.svg", alt: "Discord" },
                { icon: "/images/social/github.svg", alt: "GitHub" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{
                    scale: 1.2,
                    rotate: 10,
                  }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md">
                    <Image
                      src={social.icon}
                      alt={social.alt}
                      width={24}
                      height={24}
                    />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between pt-8 border-t border-gray-200">
            <div className="flex space-x-8 mb-6 md:mb-0 justify-center md:justify-start">
              <motion.div className="text-center mt-8 text-sm font-dmsans text-gray-500">
                <p>
                  © 2024 Maybee Markets 🐝. All your base are belong to us. 🐸
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
