"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries, IPriceLine } from "lightweight-charts";

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
  targetPrice?: number;
}

interface MarketStreamMessage {
  symbol: string;
  interval: string;
  kline: StreamKline;
  prediction?: MarketPrediction;
}

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

const AiPredictionDisplay = ({ prediction, isLoading }: { prediction: MarketPrediction | null, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse">
        <div className="h-10 w-32 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (!prediction) return null;
  
  const config = {
    up: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: "↑", label: "ПРОГНОЗ РОСТА" },
    down: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: "↓", label: "ПРОГНОЗ ПАДЕНИЯ" },
    neutral: { color: "text-zinc-400 bg-zinc-800/50 border-zinc-700", icon: "→", label: "ФЛЭТ / НЕЙТРАЛЬНО" }
  };

  const currentConf = config[prediction.trend];

  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border ${currentConf.color}`}>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">AI Ensemble</span>
        <span className="text-sm font-bold">{currentConf.label}</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-2xl font-black leading-none">
          {currentConf.icon} {prediction.confidence}%
        </div>
        {prediction.targetPrice && (
          <div className="text-[10px] font-semibold opacity-80 mt-1">
            Цель: ${prediction.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CoinPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  
  const [activeInterval, setActiveInterval] = useState<string>("1d");
  const [aiInterval, setAiInterval] = useState<string>("1d");
  const [activeRange, setActiveRange] = useState<string>("ALL");
  
  const aiIntervalRef = useRef(aiInterval);
  useEffect(() => {
    aiIntervalRef.current = aiInterval;
  }, [aiInterval]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const aiLineRef = useRef<IPriceLine | null>(null);

  // ЭФФЕКТ 1: Инициализация холста
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
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

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // ЭФФЕКТ 2: Отрисовка линии прогноза на графике
  useEffect(() => {
    if (!seriesRef.current) return;

    if (aiLineRef.current) {
      seriesRef.current.removePriceLine(aiLineRef.current);
      aiLineRef.current = null;
    }

    if (prediction && prediction.targetPrice) {
      aiLineRef.current = seriesRef.current.createPriceLine({
        price: prediction.targetPrice,
        color: prediction.trend === 'up' ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `AI Цель (${aiInterval})`,
      });
    }
  }, [prediction, aiInterval]);

  // ЭФФЕКТ 3: Загрузка ИИ-прогноза
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setIsAiLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`http://localhost:3000/market/predict/${symbol}?interval=${aiInterval}`, { headers });
        if (res.ok) {
          const predData = await res.json();
          setPrediction(predData);
        } else {
          setPrediction(null);
        }
      } catch (error) {
        console.error("Ошибка загрузки ИИ:", error);
        setPrediction(null);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchPrediction();
  }, [symbol, aiInterval]);

  // 👇 ЭФФЕКТ 4: ИСПРАВЛЕННАЯ Загрузка Графика и WebSocket
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    seriesRef.current.setData([]);
    setActiveRange("ALL");

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const historyRes = await fetch(`http://localhost:3000/market/history/${symbol}?interval=${activeInterval}`, { headers });

        if (historyRes.ok) {
          const data = await historyRes.json();
          
          // МАГИЯ: Умное исправление времени (отрезаем миллисекунды только если они есть)
          let formattedData = data.map((item: StreamKline) => {
            const correctTime = item.time > 10000000000 
              ? Math.floor(item.time / 1000) 
              : Math.floor(item.time);

            return {
              ...item,
              time: correctTime as Time
            };
          });

          // Сортируем от старых свечей к новым (чтобы график не ломался)
          formattedData.sort((a: StreamKline, b: StreamKline) => (a.time as number) - (b.time as number));

          // Удаляем дубликаты времени (если биржа случайно отдала две одинаковые свечи)
          formattedData = formattedData.filter((item: StreamKline, index: number, array: StreamKline[]) => 
            index === 0 || item.time !== array[index - 1].time
          );

          if (seriesRef.current && chartRef.current) {
            seriesRef.current.setData(formattedData);
            chartRef.current.timeScale().fitContent(); 
          }
          if (formattedData.length > 0) {
            setCurrentPrice(formattedData[formattedData.length - 1].close);
          }
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
        
        if (data.prediction && activeInterval === aiIntervalRef.current) {
          setPrediction(data.prediction);
        }
        
        if (seriesRef.current) {
          // Умное исправление времени для WebSocket
          const correctSocketTime = data.kline.time > 10000000000 
            ? Math.floor(data.kline.time / 1000) 
            : Math.floor(data.kline.time);

          seriesRef.current.update({
            time: correctSocketTime as Time, 
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
    };
  }, [symbol, activeInterval]);

  const setTimeRange = (seconds: number | "ALL") => {
    setActiveRange(String(seconds));
    if (!chartRef.current) return;

    if (seconds === "ALL") {
      chartRef.current.timeScale().fitContent();
    } else {
      // eslint-disable-next-line react-hooks/purity
      const to = Math.floor(Date.now() / 1000);
      const from = to - seconds; 
      chartRef.current.timeScale().setVisibleRange({ from: from as Time, to: to as Time });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/market" className="text-orange-400 hover:text-orange-300 font-bold transition-colors mb-6 inline-block">
        &larr; Назад к списку
      </Link>

      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-black/50 border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-zinc-800/80 pb-6 gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white">
              {symbol.replace("usdt", " / USDT")}
            </h1>
            <div className="flex items-center gap-6">
              {currentPrice ? (
                <div className="text-4xl font-black text-white tracking-tight">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              ) : (
                <div className="animate-pulse bg-zinc-800 h-10 w-32 rounded"></div>
              )}
              
              <AiPredictionDisplay prediction={prediction} isLoading={isAiLoading} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider w-24">Прогноз ИИ:</span>
              <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
                {[
                  { label: '15 Мин', value: '15m' },
                  { label: '1 Час', value: '1h' },
                  { label: '1 День', value: '1d' }
                ].map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => setAiInterval(interval.value)}
                    className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                      aiInterval === interval.value
                        ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                        : 'text-zinc-400 hover:text-orange-400 hover:bg-zinc-800'
                    }`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider w-24">График:</span>
              <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
                {[
                  { label: '1 Мин', value: '1m' },
                  { label: '15 Мин', value: '15m' },
                  { label: '1 Час', value: '1h' },
                  { label: '1 День', value: '1d' }
                ].map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => setActiveInterval(interval.value)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      activeInterval === interval.value
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
                    }`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider w-24">Масштаб:</span>
              <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
                {(RANGE_OPTIONS[activeInterval] || RANGE_OPTIONS["1d"]).map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setTimeRange(range.seconds)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      activeRange === String(range.seconds)
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
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
          className="w-full h-125 rounded-2xl overflow-hidden border border-zinc-800/50"
        />
      </div>
    </div>
  );
}