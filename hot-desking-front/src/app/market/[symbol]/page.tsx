"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createChart, IChartApi, ISeriesApi, Time, IPriceLine } from "lightweight-charts";
import { useChartArrows } from '@/src/hooks/useChartArrows';

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

interface PortfolioAsset {
  symbol: string;
  amount: number;
  [key: string]: unknown;
}

const RANGE_OPTIONS: Record<string, { label: string; seconds: number | "ALL" }[]> = {
  "1m": [
    { label: "15 Хв", seconds: 15 * 60 },
    { label: "1 Год", seconds: 60 * 60 },
    { label: "4 Год", seconds: 4 * 60 * 60 },
    { label: "Увесь час", seconds: "ALL" }
  ],
  "15m": [
    { label: "4 Год", seconds: 4 * 60 * 60 },
    { label: "12 Год", seconds: 12 * 60 * 60 },
    { label: "1 День", seconds: 24 * 60 * 60 },
    { label: "Увесь час", seconds: "ALL" }
  ],
  "1h": [
    { label: "1 День", seconds: 24 * 60 * 60 },
    { label: "3 Дні", seconds: 3 * 24 * 60 * 60 },
    { label: "1 Тиждень", seconds: 7 * 24 * 60 * 60 },
    { label: "Увесь час", seconds: "ALL" }
  ],
  "1d": [
    { label: "1 Міс", seconds: 30 * 24 * 60 * 60 },
    { label: "6 Міс", seconds: 6 * 30 * 24 * 60 * 60 },
    { label: "1 Рік", seconds: 365 * 24 * 60 * 60 },
    { label: "Увесь час", seconds: "ALL" }
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
    up: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: "↑", label: "ПРОГНОЗ РОСТУ" },
    down: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: "↓", label: "ПРОГНОЗ ПАДІННЯ" },
    neutral: { color: "text-zinc-400 bg-zinc-800/50 border-zinc-700", icon: "→", label: "ФЛЕТ / НЕЙТРАЛЬНО" }
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
            Ціль: ${prediction.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CoinPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  
  const baseAsset = symbol.toUpperCase().replace("USDT", "");
  const quoteAsset = "USDT";

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  
  const [activeInterval, setActiveInterval] = useState<string>("1d");
  const [aiInterval, setAiInterval] = useState<string>("1d");
  const [activeRange, setActiveRange] = useState<string>("ALL");
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [assetBalance, setAssetBalance] = useState<number>(0);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [inputValue, setInputValue] = useState<string>("");
  const [inputCurrency, setInputCurrency] = useState<'BASE' | 'QUOTE'>('BASE');

  // 👇 ДОДАНО: Стани для Stop Loss та Take Profit
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");

  const aiIntervalRef = useRef(aiInterval);
  useEffect(() => {
    aiIntervalRef.current = aiInterval;
  }, [aiInterval]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const aiLineRef = useRef<IPriceLine | null>(null);

  const { isDrawingMode, toggleDrawingMode, clearArrows, initDrawing, restoreMarkers } = useChartArrows();

  const fetchPortfolio = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`http://localhost:3000/trade/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.walletBalance);
        
        const asset = data.activePositions.find((p: PortfolioAsset) => 
          p.symbol.toLowerCase() === symbol.toLowerCase()
        );
        setAssetBalance(asset ? asset.amount : 0);
      }
    } catch (error) {
      console.error("Ошибка загрузки портфеля:", error);
    }
  }, [symbol]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    initDrawing(chart, candlestickSeries);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [initDrawing]);

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
        title: `AI Ціль (${aiInterval})`,
      });
    }
  }, [prediction, aiInterval]);

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
          
          let formattedData = data.map((item: StreamKline) => {
            const correctTime = item.time > 10000000000 ? Math.floor(item.time / 1000) : Math.floor(item.time);
            return { ...item, time: correctTime as Time };
          });

          formattedData.sort((a: StreamKline, b: StreamKline) => (a.time as number) - (b.time as number));
          formattedData = formattedData.filter((item: StreamKline, index: number, array: StreamKline[]) => 
            index === 0 || item.time !== array[index - 1].time
          );

          if (seriesRef.current && chartRef.current) {
            seriesRef.current.setData(formattedData);
            chartRef.current.timeScale().fitContent(); 
            
            restoreMarkers();
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
          const correctSocketTime = data.kline.time > 10000000000 ? Math.floor(data.kline.time / 1000) : Math.floor(data.kline.time);
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
  }, [symbol, activeInterval, restoreMarkers]); 

  const setTimeRange = useCallback((seconds: number | "ALL") => {
    setActiveRange(String(seconds));
    if (!chartRef.current) return;

    if (seconds === "ALL") {
      chartRef.current.timeScale().fitContent();
    } else {
      const now = new Date();
      const to = Math.floor(now.getTime() / 1000);
      const from = to - seconds; 
      chartRef.current.timeScale().setVisibleRange({ from: from as Time, to: to as Time });
    }
  }, []);

  const parsedInput = Number(inputValue) || 0;
  let calculatedAmountBase = 0;
  let calculatedCostQuote = 0;

  if (currentPrice) {
    if (inputCurrency === 'BASE') {
      calculatedAmountBase = parsedInput; 
      calculatedCostQuote = parsedInput * currentPrice; 
    } else {
      calculatedCostQuote = parsedInput; 
      calculatedAmountBase = parsedInput / currentPrice; 
    }
  }

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!parsedInput || parsedInput <= 0 || !currentPrice) {
      setTradeMessage({ type: 'error', text: 'Введіть коректну суму' });
      return;
    }

    try {
      setIsTrading(true);
      setTradeMessage(null);
      const token = localStorage.getItem("token");

      // 👇 ДОДАНО: Конвертуємо SL/TP в числа і відправляємо тільки якщо вони є
      const slValue = Number(stopLoss);
      const tpValue = Number(takeProfit);

      const res = await fetch(`http://localhost:3000/trade/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          amount: calculatedAmountBase, 
          type,
          ...(slValue > 0 && { stopLoss: slValue }),
          ...(tpValue > 0 && { takeProfit: tpValue })
        })
      });

      const data = await res.json();

      if (res.ok) {
        setTradeMessage({ type: 'success', text: `Ордер ${type} успішно виконано!` });
        setInputValue("");
        setStopLoss("");   // Очищаємо поля після успіху
        setTakeProfit(""); // Очищаємо поля після успіху
        fetchPortfolio();
      } else {
        setTradeMessage({ type: 'error', text: data.message || 'Помилка виконання ордера' });
      }
    } catch (error) {
      console.error(error);
      setTradeMessage({ type: 'error', text: 'Помилка мережі' });
    } finally {
      setIsTrading(false);
      setTimeout(() => setTradeMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-350 mx-auto px-4 py-8">
      <Link href="/market" className="text-orange-400 hover:text-orange-300 font-bold transition-colors mb-6 inline-block">
        &larr; Назад до списків
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-zinc-800 p-6 sm:p-8">
          <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center mb-8 border-b border-zinc-800/80 pb-6 gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white">
                {symbol.replace(/usdt/i, " / USDT")}
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

            <div className="flex flex-wrap gap-4 justify-start 2xl:justify-end items-center">
              
              {/* Інструменти малювання */}
              <div className="flex items-center gap-2 mr-4 border-r border-zinc-800/80 pr-4">
                <button
                  onClick={toggleDrawingMode}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                    isDrawingMode 
                      ? 'bg-purple-500 text-zinc-950 shadow-md shadow-purple-500/20' 
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-purple-400'
                  }`}
                  title="Клікніть по графіку, щоб додати стрілку"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  {isDrawingMode ? "Малювання Увімк." : "Малювати"}
                </button>
                <button
                  onClick={clearArrows}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all border border-transparent"
                  title="Очистити всі стрілки"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>

              {/* Прогноз */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Прогноз:</span>
                <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800">
                  {[{ label: '15хв', value: '15m' }, { label: '1г', value: '1h' }, { label: '1д', value: '1d' }].map((interval) => (
                    <button
                      key={interval.value}
                      onClick={() => setAiInterval(interval.value)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
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

              {/* Свічки */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Свічки:</span>
                <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800">
                  {[{ label: '1хв', value: '1m' }, { label: '15хв', value: '15m' }, { label: '1г', value: '1h' }, { label: '1д', value: '1d' }].map((interval) => (
                    <button
                      key={interval.value}
                      onClick={() => setActiveInterval(interval.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        activeInterval === interval.value ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
                      }`}
                    >
                      {interval.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Масштаб */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Масштаб:</span>
                <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800">
                  {(RANGE_OPTIONS[activeInterval] || RANGE_OPTIONS["1d"]).map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setTimeRange(range.seconds)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        activeRange === String(range.seconds) ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div ref={chartContainerRef} className="w-full h-125 rounded-xl overflow-hidden border border-zinc-800/50" />
        </div>

        {/* Торгова панель */}
        <div className="w-full xl:w-96 flex flex-col gap-6">
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Торгівля</h2>
            
            <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mb-6">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Доступно USDT</p>
                <p className="text-lg font-bold text-white">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">В активі {baseAsset}</p>
                <p className="text-lg font-bold text-white">{assetBalance}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Режим вводу:
                </label>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setInputCurrency('BASE')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputCurrency === 'BASE' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {baseAsset}
                  </button>
                  <button
                    onClick={() => setInputCurrency('QUOTE')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${inputCurrency === 'QUOTE' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {quoteAsset}
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-600"
                />
                <span className="absolute right-4 top-3.5 text-zinc-500 font-bold">
                  {inputCurrency === 'BASE' ? baseAsset : quoteAsset}
                </span>
              </div>
              
              <div className="flex justify-between mt-3 px-1">
                <span className="text-xs font-medium text-zinc-500">Оцінка угоди:</span>
                <span className="text-xs font-bold text-white">
                  {inputCurrency === 'BASE' 
                    ? `≈ ${calculatedCostQuote.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                    : `≈ ${calculatedAmountBase.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${baseAsset}`
                  }
                </span>
              </div>
            </div>

            {/* 👇 ДОДАНО: Поля для введення Stop Loss та Take Profit */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Stop Loss
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-600 font-bold">USDT</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Take Profit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-600 font-bold">USDT</span>
                </div>
              </div>
            </div>

            {tradeMessage && (
              <div className={`p-3 rounded-xl mb-6 text-sm font-bold ${
                tradeMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {tradeMessage.text}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => handleTrade('BUY')}
                disabled={isTrading || !currentPrice}
                className="flex-1 bg-green-500 hover:bg-green-400 text-green-950 font-black py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTrading ? 'ОБРОБКА...' : 'КУПИТИ'}
              </button>
              <button
                onClick={() => handleTrade('SELL')}
                disabled={isTrading || !currentPrice}
                className="flex-1 bg-red-500 hover:bg-red-400 text-red-950 font-black py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTrading ? 'ОБРОБКА...' : 'ПРОДАТИ'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}