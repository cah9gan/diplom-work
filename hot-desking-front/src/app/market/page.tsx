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
      up: "bg-green-100 text-green-700 border-green-200",
      down: "bg-red-100 text-red-700 border-red-200",
      neutral: "bg-slate-100 text-slate-600 border-slate-200",
    };

    const icons = {
      up: "↗",
      down: "↘",
      neutral: "→",
    };

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${colors[prediction.trend]}`}>
        <span className="text-[10px] uppercase opacity-75">AI</span>
        <span>{icons[prediction.trend]}</span>
        <span>{prediction.confidence}%</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Рынки</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-slate-500 font-medium">
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
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-xl uppercase group-hover:text-blue-600 transition-colors">
                    {coin.symbol.replace('USDT', ' / USDT')}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {coin.interval}
                    </div>
                    {/* 👇 Выводим ИИ бейдж */}
                    {renderPredictionBadge(coin.prediction)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-slate-400 text-sm mb-1">Текущая цена</div>
                  <div className="font-bold text-2xl text-slate-900">
                    ${coin.kline.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm mt-4 border-t border-slate-50 pt-4">
                <div>
                  <span className="text-slate-400">Мин: </span>
                  <span className="text-red-500 font-medium">${coin.kline.low}</span>
                </div>
                <div>
                  <span className="text-slate-400">Макс: </span>
                  <span className="text-green-500 font-medium">${coin.kline.high}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-center py-10">Ожидание данных от биржи...</div>
      )}
    </div>
  );
}