"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useParams } from "next/navigation";
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

// Конфигурация динамических кнопок масштаба в зависимости от размера свечи (в секундах)
const RANGE_OPTIONS: Record<string, { label: string; seconds: number | "ALL" }[]> = {
  "1m": [
    { label: "15 Мин", seconds: 15 * 60 },
    { label: "1 Час", seconds: 60 * 60 },
    { label: "4 Часа", seconds: 4 * 60 * 60 },
    { label: "Всё время", seconds: "ALL" }
  ],
  "15m": [
    { label: "4 Часа", seconds: 4 * 60 * 60 },
    { label: "12 Часов", seconds: 12 * 60 * 60 },
    { label: "1 День", seconds: 24 * 60 * 60 },
    { label: "Всё время", seconds: "ALL" }
  ],
  "1h": [
    { label: "1 День", seconds: 24 * 60 * 60 },
    { label: "3 Дня", seconds: 3 * 24 * 60 * 60 },
    { label: "1 Неделя", seconds: 7 * 24 * 60 * 60 },
    { label: "Всё время", seconds: "ALL" }
  ],
  "1d": [
    { label: "1 Мес", seconds: 30 * 24 * 60 * 60 },
    { label: "6 Мес", seconds: 6 * 30 * 24 * 60 * 60 },
    { label: "1 Год", seconds: 365 * 24 * 60 * 60 },
    { label: "Всё время", seconds: "ALL" }
  ]
};

export default function CoinPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [activeInterval, setActiveInterval] = useState<string>("1d");
  const [activeRange, setActiveRange] = useState<string>("ALL");
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // ЭФФЕКТ 1: Инициализация холста графика (Срабатывает ОДИН РАЗ при монтировании)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#64748b" },
      grid: { vertLines: { color: "#f1f5f9" }, horzLines: { color: "#f1f5f9" } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Ресайз холста
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    // При размонтировании страницы полностью удаляем график
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // ЭФФЕКТ 2: Загрузка данных и Вебсокет (Перезапускается при смене монеты или размера свечи)
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    // Очищаем старые свечи перед загрузкой новых данных, чтобы они не накладывались
    seriesRef.current.setData([]);
    setActiveRange("ALL");

    const fetchHistory = async () => {
      try {
        // 1. Достаем токен из хранилища
        const token = localStorage.getItem("token");

        // 2. Добавляем токен в заголовки запроса
        const response = await fetch(`http://localhost:3000/market/history/${symbol}?interval=${activeInterval}`, {
          headers: {
            Authorization: `Bearer ${token}` // 👈 Тот самый ключ от двери
          }
        });

        // 3. Защита от падений: если бэкенд ответил ошибкой (например, токен протух), прерываем функцию
        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        
        if (seriesRef.current && chartRef.current) {
          seriesRef.current.setData(data);
          chartRef.current.timeScale().fitContent(); 
        }
        
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
      if (data.symbol.toLowerCase() === symbol.toLowerCase() && data.interval === activeInterval) {
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
      socket.disconnect(); // Отключаем только сокет, график не трогаем!
    };
  }, [symbol, activeInterval]);

  // Изменение масштаба (зума) без багов времени
  const setTimeRange = (seconds: number | "ALL") => {
    setActiveRange(String(seconds));
    
    if (!chartRef.current) return;

    if (seconds === "ALL") {
      chartRef.current.timeScale().fitContent();
    } else {
      // eslint-disable-next-line react-hooks/purity
      const to = Math.floor(Date.now() / 1000);
      const from = to - seconds; 
      
      chartRef.current.timeScale().setVisibleRange({ 
        from: from as Time, 
        to: to as Time 
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/market" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Назад к списку
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 border-b border-slate-100 pb-4 gap-6">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide">
              {symbol.replace("usdt", " / USDT")}
            </h1>
            {currentPrice ? (
              <div className="text-4xl font-bold text-slate-900 tracking-tight mt-1">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
            ) : (
              <div className="animate-pulse bg-slate-200 h-10 w-32 rounded mt-1"></div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* ТАЙМФРЕЙМЫ */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Свеча:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { label: '1 Мин', value: '1m' },
                  { label: '15 Мин', value: '15m' },
                  { label: '1 Час', value: '1h' },
                  { label: '1 День', value: '1d' }
                ].map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => setActiveInterval(interval.value)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeInterval === interval.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            {/* МАСШТАБ (Отображается динамически) */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Масштаб:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(RANGE_OPTIONS[activeInterval] || RANGE_OPTIONS["1d"]).map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setTimeRange(range.seconds)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeRange === String(range.seconds)
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={chartContainerRef} 
          className="w-full h-125 rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}