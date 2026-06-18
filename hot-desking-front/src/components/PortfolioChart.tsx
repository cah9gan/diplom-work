"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Интерфейсы пропсов
interface PortfolioPosition {
  symbol: string;
  amount: number;
  currentPrice: number;
  stopLoss?: number | null;    // 👈 Добавили поддержку защитных ордеров
  takeProfit?: number | null;  // 👈 Добавили поддержку защитных ордеров
}

interface PortfolioChartProps {
  walletBalance: number;
  activePositions: PortfolioPosition[];
}

// Интерфейс для объектов данных, передаваемых в Recharts
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

// Строго типизируем пропсы для нашего кастомного тултипа (без any)
interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: ChartDataItem; // Внутренний объект данных Recharts
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const COLORS = [
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
];

// Компонент тултипа вынесен наружу (выполняется правило react-hooks/static-components)
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const hasSL = item.payload.stopLoss !== undefined && item.payload.stopLoss !== null;
    const hasTP = item.payload.takeProfit !== undefined && item.payload.takeProfit !== null;

    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl min-w-44">
        <p className="text-zinc-300 font-bold mb-1">{item.name}</p>
        <p className="text-white font-black">
          ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        
        {/* 👇 БЛОК СЛ/ТП ПРИ НАВЕДЕНИИ НА СЕКТОР */}
        {(hasSL || hasTP) && (
          <div className="border-t border-zinc-800 pt-1.5 mt-1.5 flex flex-col gap-0.5 text-[11px]">
            {hasSL && (
              <p className="text-red-400 font-medium">
                <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider mr-1.5">SL:</span>
                ${Number(item.payload.stopLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            )}
            {hasTP && (
              <p className="text-green-400 font-medium">
                <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider mr-1.5">TP:</span>
                ${Number(item.payload.takeProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function PortfolioChart({ walletBalance, activePositions }: PortfolioChartProps) {
  // Явно указываем тип массива для идеальной проверки линтером
  const data: ChartDataItem[] = [
    {
      name: "Вільний USDT",
      value: Number(walletBalance),
      color: "#52525b",
    },
    ...activePositions.map((pos, index) => ({
      name: pos.symbol.replace("USDT", ""),
      value: pos.amount * pos.currentPrice,
      color: COLORS[index % COLORS.length],
      stopLoss: pos.stopLoss,     // 👈 Пробрасываем SL в Recharts объект
      takeProfit: pos.takeProfit, // 👈 Пробрасываем TP в Recharts объект
    })),
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return <div className="text-zinc-500 text-center py-10">Немає даних для відображення</div>;
  }

  return (
    <div className="h-auto w-full relative">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Легенда под графиком */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4">
        {data.map((item, index) => {
          const hasSL = item.stopLoss !== undefined && item.stopLoss !== null;
          const hasTP = item.takeProfit !== undefined && item.takeProfit !== null;

          return (
            <div key={index} className="flex flex-col items-start gap-0.5 bg-zinc-950/30 border border-zinc-800/40 px-3 py-1.5 rounded-xl min-w-32">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-3 rounded-xs" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-zinc-400 font-semibold">
                  {item.name} <span className="text-white font-black">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </span>
              </div>
              
              {/* 👇 МАКЕТ ЛЕГЕНДЫ С ПОДПИСЯМИ ОРДЕРОВ ПОД МОНЕТОЙ */}
              {(hasSL || hasTP) && (
                <div className="flex gap-2 text-[9px] font-bold tracking-wider pl-4 mt-0.5">
                  {hasSL && <span className="text-red-500/70">SL: ${Number(item.stopLoss).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>}
                  {hasTP && <span className="text-green-500/70">TP: ${Number(item.takeProfit).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}