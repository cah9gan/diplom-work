"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

interface PortfolioAsset {
  symbol: string;
  amount: number;
  [key: string]: unknown;
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

  // 👇 НОВЫЕ СОСТОЯНИЯ ДЛЯ ПЕРЕКЛЮЧАТЕЛЯ ВВОДА 👇
  const [inputValue, setInputValue] = useState<string>("");
  const [inputCurrency, setInputCurrency] = useState<'BASE' | 'QUOTE'>('BASE');

  const aiIntervalRef = useRef(aiInterval);
  useEffect(() => {
    aiIntervalRef.current = aiInterval;
  }, [aiInterval]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const aiLineRef = useRef<IPriceLine | null>(null);

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
    const initPortfolio = async () => {
      await fetchPortfolio();
    };

    initPortfolio();
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
  }, [symbol, activeInterval]);

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

  // 👇 ЛОГИКА РАСЧЕТОВ 👇
  const parsedInput = Number(inputValue) || 0;
  let calculatedAmountBase = 0;
  let calculatedCostQuote = 0;

  if (currentPrice) {
    if (inputCurrency === 'BASE') {
      calculatedAmountBase = parsedInput; // Пользователь ввел кол-во BTC
      calculatedCostQuote = parsedInput * currentPrice; // Считаем стоимость в USDT
    } else {
      calculatedCostQuote = parsedInput; // Пользователь ввел сумму в USDT
      calculatedAmountBase = parsedInput / currentPrice; // Считаем кол-во BTC
    }
  }

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!parsedInput || parsedInput <= 0 || !currentPrice) {
      setTradeMessage({ type: 'error', text: 'Введите корректную сумму' });
      return;
    }

    try {
      setIsTrading(true);
      setTradeMessage(null);
      const token = localStorage.getItem("token");

      // Бэкенд всегда ждет количество в базовом активе (BTC)
      const res = await fetch(`http://localhost:3000/trade/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          amount: calculatedAmountBase, 
          type
        })
      });

      const data = await res.json();

      if (res.ok) {
        setTradeMessage({ type: 'success', text: `Ордер ${type} успешно выполнен!` });
        setInputValue("");
        fetchPortfolio();
      } else {
        setTradeMessage({ type: 'error', text: data.message || 'Ошибка выполнения ордера' });
      }
    } catch (error) {
      console.error(error);
      setTradeMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setIsTrading(false);
      setTimeout(() => setTradeMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-350 mx-auto px-4 py-8">
      <Link href="/market" className="text-orange-400 hover:text-orange-300 font-bold transition-colors mb-6 inline-block">
        &larr; Назад к спискам
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* ЛЕВАЯ ЧАСТЬ: График и статистика */}
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

            {/* Настройки графика и ИИ */}
            <div className="flex flex-wrap gap-4 justify-start 2xl:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Прогноз:</span>
                <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800">
                  {[{ label: '15м', value: '15m' }, { label: '1ч', value: '1h' }, { label: '1д', value: '1d' }].map((interval) => (
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

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Свечи:</span>
                <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800">
                  {[{ label: '1м', value: '1m' }, { label: '15м', value: '15m' }, { label: '1ч', value: '1h' }, { label: '1д', value: '1d' }].map((interval) => (
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

        {/* ПРАВАЯ ЧАСТЬ: Торговая панель */}
        <div className="w-full xl:w-96 flex flex-col gap-6">
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Торговля</h2>
            
            {/* Балансы */}
            <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mb-6">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Доступно USDT</p>
                <p className="text-lg font-bold text-white">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">В активе {baseAsset}</p>
                <p className="text-lg font-bold text-white">{assetBalance}</p>
              </div>
            </div>

            {/* 👇 ОБНОВЛЕННЫЙ ВВОД 👇 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Режим ввода:
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
              
              {/* Оценка */}
              <div className="flex justify-between mt-3 px-1">
                <span className="text-xs font-medium text-zinc-500">Оценка сделки:</span>
                <span className="text-xs font-bold text-white">
                  {inputCurrency === 'BASE' 
                    ? `≈ ${calculatedCostQuote.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                    : `≈ ${calculatedAmountBase.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${baseAsset}`
                  }
                </span>
              </div>
            </div>

            {/* Оповещения */}
            {tradeMessage && (
              <div className={`p-3 rounded-xl mb-6 text-sm font-bold ${
                tradeMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {tradeMessage.text}
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4">
              <button
                onClick={() => handleTrade('BUY')}
                disabled={isTrading || !currentPrice}
                className="flex-1 bg-green-500 hover:bg-green-400 text-green-950 font-black py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTrading ? 'ОБРАБОТКА...' : 'КУПИТЬ'}
              </button>
              <button
                onClick={() => handleTrade('SELL')}
                disabled={isTrading || !currentPrice}
                className="flex-1 bg-red-500 hover:bg-red-400 text-red-950 font-black py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTrading ? 'ОБРАБОТКА...' : 'ПРОДАТЬ'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}