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

interface MarketStreamMessage {
  symbol: string;
  interval: string;
  kline: StreamKline;
}

export default function MarketPage() {
  // Теперь храним данные в виде объекта: { "BTCUSDT": { ... }, "ETHUSDT": { ... } }
  const [marketData, setMarketData] = useState<Record<string, MarketStreamMessage>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000/market-stream");

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("kline-update", (data: MarketStreamMessage) => {
      // Обновляем данные только для конкретной прилетевшей монеты, оставляя остальные как есть
      setMarketData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Превращаем наш объект в массив для удобного рендера
  const coins = Object.values(marketData);

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
            // Делаем всю карточку кликабельной ссылкой
            <Link 
              href={`/market/${coin.symbol.toLowerCase()}`} 
              key={coin.symbol}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold text-xl uppercase group-hover:text-blue-600 transition-colors">
                  {coin.symbol.replace('USDT', ' / USDT')}
                </div>
                <div className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {coin.interval}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-slate-400 text-sm mb-1">Текущая цена</div>
                <div className="font-bold text-2xl text-slate-900">
                  ${coin.kline.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>

              <div className="flex justify-between text-sm">
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