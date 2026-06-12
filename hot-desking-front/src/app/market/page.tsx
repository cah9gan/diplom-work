"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

interface StreamKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

interface MarketPrediction {
  trend: 'up' | 'down' | 'neutral';
  confidence: number;
}

interface MarketStreamMessage {
  symbol: string;
  interval: string;
  kline: StreamKline;
  prediction?: MarketPrediction; // 👈 Добавили интерфейс предсказания
}

export default function MarketPage() {
  const [marketData, setMarketData] = useState<Record<string, MarketStreamMessage>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000/market-stream");

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("kline-update", (data: MarketStreamMessage) => {
      setMarketData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const coins = Object.values(marketData);

  // Хелпер для рендера бейджа предсказания
  const renderPredictionBadge = (prediction?: MarketPrediction) => {
    if (!prediction) return null;

    const colors = {
      up: "bg-green-500/10 text-green-400 border-green-500/20",
      down: "bg-red-500/10 text-red-400 border-red-500/20",
      neutral: "bg-zinc-800/50 text-zinc-400 border-zinc-700",
    };

    const icons = {
      up: "↗",
      down: "↘",
      neutral: "→",
    };

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${colors[prediction.trend]}`}>
        <span className="text-[10px] uppercase opacity-75">AI</span>
        <span>{icons[prediction.trend]}</span>
        <span>{prediction.confidence}%</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Рынки</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-zinc-400 font-bold">
            {isConnected ? 'LIVE' : 'Подключение...'}
          </span>
        </div>
      </div>

      {coins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coins.map((coin) => (
            <Link 
              href={`/market/${coin.symbol.toLowerCase()}`} 
              key={coin.symbol}
              className="bg-zinc-900/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800 hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden"
            >
              {/* Легкое оранжевое свечение на фоне при наведении */}
              <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-extrabold text-xl tracking-wide uppercase text-white group-hover:text-orange-400 transition-colors">
                    {coin.symbol.replace('USDT', ' / USDT')}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-lg">
                      {coin.interval}
                    </div>
                    {/* 👇 Выводим ИИ бейдж */}
                    {renderPredictionBadge(coin.prediction)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-zinc-500 text-sm mb-1.5 font-medium">Текущая цена</div>
                  <div className="font-black text-3xl text-white tracking-tight">
                    ${coin.kline.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm mt-6 border-t border-zinc-800/80 pt-5 relative z-10">
                <div>
                  <span className="text-zinc-500">Мин: </span>
                  <span className="text-red-400 font-bold">${coin.kline.low}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Макс: </span>
                  <span className="text-green-400 font-bold">${coin.kline.high}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 text-center py-16 font-medium bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
          Ожидание данных от биржи...
        </div>
      )}
    </div>
  );
}