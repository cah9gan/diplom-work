"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useParams } from "next/navigation";
// 1. Импортируем CandlestickSeries напрямую из библиотеки
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries } from "lightweight-charts";

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

export default function CoinPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // 2. Обновляем типизацию ссылки
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "#f1f5f9" },
        horzLines: { color: "#f1f5f9" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 3. Используем новый синтаксис v5.0 для добавления свечей
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:3000/market/history/${symbol}?interval=1d`);
        const data = await response.json();
        
        candlestickSeries.setData(data);
        
        if (data.length > 0) {
          setCurrentPrice(data[data.length - 1].close);
        }
      } catch (error) {
        console.error("Ошибка загрузки истории:", error);
      }
    };

    fetchHistory();

    const socket: Socket = io("http://localhost:3000/market-stream");

    socket.on("kline-update", (data: MarketStreamMessage) => {
      if (data.symbol.toLowerCase() === symbol.toLowerCase()) {
        setCurrentPrice(data.kline.close);
        
        if (seriesRef.current) {
          seriesRef.current.update({
            time: Math.floor(data.kline.time / 1000) as Time, 
            open: data.kline.open,
            high: data.kline.high,
            low: data.kline.low,
            close: data.kline.close,
          });
        }
      }
    });

    return () => {
      socket.disconnect();
      chart.remove();
    };
  }, [symbol]);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/market" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Назад к списку
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-wide">
            {symbol.replace("usdt", " / USDT")}
          </h1>
          {currentPrice ? (
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          ) : (
            <div className="animate-pulse bg-slate-200 h-10 w-32 rounded"></div>
          )}
        </div>

        {/* 4. Исправили h-[500px] на элегантный h-125 */}
        <div 
          ref={chartContainerRef} 
          className="w-full h-125 rounded-xl overflow-hidden"
        />
        
        <div className="mt-4 text-center text-sm text-slate-400">
          Интервал: 1 день. Данные обновляются в реальном времени.
        </div>
      </div>
    </div>
  );
}