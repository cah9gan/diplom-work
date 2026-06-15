"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Типы пропсов (можешь импортировать из своего файла типов, если выносил)
interface PortfolioPosition {
  symbol: string;
  amount: number;
  currentPrice: number;
}

interface PortfolioChartProps {
  walletBalance: number;
  activePositions: PortfolioPosition[];
}

// Палитра цветов для графика (подходит под твою темную тему)
const COLORS = [
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
];

export function PortfolioChart({ walletBalance, activePositions }: PortfolioChartProps) {
  // Формируем данные для графика
  const data = [
    // 1. Свободные средства (USDT)
    {
      name: "Вільний USDT",
      value: Number(walletBalance),
      color: "#52525b", // zinc-500 для кэша
    },
    // 2. Все купленные монеты (вычисляем их стоимость в баксах: кол-во * текущую цену)
    ...activePositions.map((pos, index) => ({
      name: pos.symbol.replace("USDT", ""),
      value: pos.amount * pos.currentPrice,
      color: COLORS[index % COLORS.length],
    })),
  ].filter((item) => item.value > 0); // Убираем нули, чтобы не ломать график

  // Кастомный тултип при наведении (чтобы он был в темном стиле)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl">
          <p className="text-zinc-300 font-bold mb-1">{payload[0].name}</p>
          <p className="text-white font-black">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return <div className="text-zinc-500 text-center py-10">Немає даних для відображення</div>;
  }

  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70} // Делает дырку внутри (Donut chart)
            outerRadius={100}
            paddingAngle={3} // Расстояние между дольками
            dataKey="value"
            stroke="none" // Убираем стандартную обводку
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Легенда (список активов под графиком) */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-zinc-400 font-medium">
              {item.name} <span className="text-white font-bold">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}