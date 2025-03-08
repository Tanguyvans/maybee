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
import Spinner from "./Spinner";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ethers } from "ethers";
import contractABI from "./abi/Maybeebets.json";
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
}

export default function Main() {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const blur = useTransform(scrollYProgress, [0, 0.5], [0, 5]);

  // Simple dark theme colors
  const colorScheme = { primary: "#FFFFFF", secondary: "#AAAAAA" };
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

            return {
              id: market.marketId,
              title: market.description,
              yesPercentage,
              noPercentage,
              liquidity: `${ethers.formatEther(
                market.totalYesAmount.add(market.totalNoAmount)
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

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        await telegramSignIn({ forceCreateUser: true });
      }
      setIsLoading(false);
    };

    signIn();
  }, [sdkHasLoaded, telegramSignIn, user]);

  // Custom Bee Loader Component
  const BeeLoader = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
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
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-yellow-400 rounded-full opacity-30"
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
          className="absolute mt-32 text-xl font-game text-yellow-400"
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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          borderColor: "#333",
          background: `rgba(0, 0, 0, 0.8)`,
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div>
              <Image
                src="/images/logo.png"
                alt="Maybee Markets 🐝"
                width={60}
                height={60}
                className="mr-2 rounded-full"
              />
            </motion.div>
            <motion.h1 className="text-3xl font-bold font-game">
              Maybee Markets 🐝
            </motion.h1>
          </motion.div>
          <div className="flex items-center space-x-4">
            <Link href="/create">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="font-game text-lg bg-zinc-800 border border-zinc-700">
                  <span className="relative z-10">Create Market</span>
                </Button>
              </motion.div>
            </Link>
            <motion.div
              className="ml-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DynamicWidget />
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        className="relative py-20 px-4 overflow-hidden"
        style={{
          opacity,
          scale,
          rotateX: rotation,
          filter: `blur(${blur}px)`,
        }}
        ref={scrollRef}
      >
        <motion.div className="absolute inset-0 z-0">
          <Image
            src="/images/pepe-background.png"
            alt="Pepe Background"
            fill
            style={{ objectFit: "cover", opacity: 0.2 }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, transparent 0%, #000000 100%)`,
            }}
          ></div>
        </motion.div>

        <div className="container mx-auto text-center relative z-1">
          <motion.h2 className="text-7xl font-bold mb-6 font-game">
            FEELS GOOD MAN
          </motion.h2>
          <motion.p className="text-2xl max-w-2xl mx-auto mb-10 font-game text-gray-300">
            The dankest prediction market in the metaverse. Trade rare Pepes,
            predict memes, and stack them gains! 🐸💰
          </motion.p>
          <div className="flex justify-center gap-4">
            <Link href="/placeBet">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="font-game text-xl bg-zinc-800 border border-zinc-700">
                  <motion.span className="relative z-10">
                    Ape In Now
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
            <Link href="/learn">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-transparent border border-zinc-700 font-game text-lg px-8 py-3">
                  Learn More Fren
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Category Filter */}
      <motion.section
        className="container mx-auto px-4 mb-8"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <div className="flex overflow-x-auto pb-2 scrollbar-hide relative">
          {/* Track indicator */}
          <motion.div className="absolute h-1 bottom-0 rounded-full bg-zinc-700" />

          <div className="flex space-x-3">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full whitespace-nowrap font-game text-lg relative overflow-hidden`}
                style={{
                  background:
                    activeCategory === category ? `#333` : `rgba(0, 0, 0, 0.8)`,
                  border: `1px solid ${
                    activeCategory === category ? "#fff" : "#555"
                  }`,
                  color: activeCategory === category ? "#fff" : "#aaa",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">{category}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Markets Grid */}
      <section className="container mx-auto px-4 pb-20">
        <motion.h3
          className="text-4xl font-bold mb-8 font-game"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Dankest Markets
        </motion.h3>
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
                  whileHover={{ scale: 1.02 }}
                  onHoverStart={() => setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                  style={{
                    background: `#111`,
                    border: `1px solid #333`,
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
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-500"
                      />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    <motion.div className="absolute bottom-4 left-4">
                      <motion.span
                        className="px-4 py-2 rounded-full text-sm font-bold font-game bg-zinc-800"
                        whileHover={{ scale: 1.05 }}
                      >
                        {market.category}
                      </motion.span>
                    </motion.div>
                  </div>
                  <div className="p-6">
                    <motion.h4 className="text-xl font-bold mb-4 font-game">
                      {market.title}
                    </motion.h4>

                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <motion.span
                          className="flex items-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.div className="w-4 h-4 rounded-full mr-2 bg-white"></motion.div>
                          <span className="font-game">
                            Based: {market.yesPercentage}%
                          </span>
                        </motion.span>
                        <motion.span
                          className="flex items-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.div className="w-4 h-4 rounded-full mr-2 bg-zinc-500"></motion.div>
                          <span className="font-game">
                            Cringe: {market.noPercentage}%
                          </span>
                        </motion.span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-4 bg-zinc-700"
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
                      <motion.span
                        className="text-sm flex items-center font-game text-gray-400"
                        whileHover={{ scale: 1.05 }}
                      >
                        🐸 {market.liquidity}
                      </motion.span>
                      <Link href={`/market/${market.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="text-sm px-6 py-3 font-game bg-zinc-800 border border-zinc-700">
                            Trade Now
                          </Button>
                        </motion.div>
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
        className="py-16 relative overflow-hidden"
        style={{
          background: `#111`,
          borderTop: `1px solid #333`,
          borderBottom: `1px solid #333`,
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 bg-[url('/images/pepe-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.h3
            className="text-4xl font-bold text-center mb-12 font-game"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            How To Get Rich
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
                className="flex flex-col items-center text-center p-8 rounded-2xl backdrop-blur-sm relative z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.3,
                  type: "spring",
                }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                style={{
                  background: `#111`,
                  border: `1px solid #333`,
                }}
              >
                <motion.div className="relative w-40 h-40 mb-8">
                  <Image src={item.image} alt={item.title} fill />
                </motion.div>
                <motion.h4 className="text-2xl font-bold mb-3 font-game">
                  {item.title}
                </motion.h4>
                <motion.p className="text-lg font-game text-gray-400">
                  {item.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="relative overflow-hidden py-12"
        style={{
          background: `#000`,
          borderTop: `1px solid #333`,
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <motion.div
              className="flex items-center mb-6 md:mb-0"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div className="rounded-full">
                <Image
                  src="/images/logo.png"
                  alt="Pepe Logo"
                  width={70}
                  height={70}
                  className="mr-3 rounded-full"
                />
              </motion.div>
              <motion.h1 className="text-3xl font-bold font-game">
                Maybee Markets 🐝
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
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
                    <Image
                      src={social.icon}
                      alt={social.alt}
                      width={24}
                      height={24}
                      style={{ filter: "brightness(10)" }}
                    />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
          <motion.div className="text-center mt-8 text-sm font-game text-gray-500">
            <p>© 2024 Maybee Markets 🐝. All your base are belong to us. 🐸</p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Add globally required styles */}
      <style jsx global>{`
        @font-face {
          font-family: "GameFont";
          src: url("/fonts/pixel.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
        }

        .font-game {
          font-family: "GameFont", sans-serif;
          letter-spacing: 1px;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
        }

        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* For Firefox */
        .scrollbar-hide {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
