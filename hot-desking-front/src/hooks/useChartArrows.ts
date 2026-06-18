import { useState, useEffect, useCallback, useRef } from "react";
import {
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  Time,
  MouseEventParams,
  CandlestickData,
} from "lightweight-charts";

export function useChartArrows() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  // 👇 Використовуємо useRef замість useState, щоб уникнути циклічних рендерів
  const markersRef = useRef<SeriesMarker<Time>[]>([]);
  const [activeSeries, setActiveSeries] =
    useState<ISeriesApi<"Candlestick"> | null>(null);
  const [activeChart, setActiveChart] = useState<IChartApi | null>(null);

  const initDrawing = useCallback(
    (chart: IChartApi, series: ISeriesApi<"Candlestick">) => {
      setActiveChart(chart);
      setActiveSeries(series);
    },
    [],
  );

  const toggleDrawingMode = () => setIsDrawingMode((prev) => !prev);

  const clearArrows = () => {
    markersRef.current = [];
    if (activeSeries) {
      activeSeries.setMarkers([]);
    }
  };

  useEffect(() => {
    if (!activeChart || !activeSeries || !isDrawingMode) return;

    const clickHandler = (param: MouseEventParams) => {
      if (!param.point || !param.time || !activeSeries) return;

      const price = activeSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      const candleData = param.seriesData.get(activeSeries) as
        | CandlestickData
        | undefined;
      // Визначаємо, клікнули вище чи нижче свічки
      let isAbove = true;
      if (candleData && typeof candleData.open === "number") {
        isAbove = price > Math.max(candleData.open, candleData.close);
      } else {
        isAbove = true; // Захист на випадок кліку в порожнечу
      }

      const newMarker: SeriesMarker<Time> = {
        time: param.time as Time,
        position: isAbove ? "aboveBar" : "belowBar",
        color: isAbove ? "#ef4444" : "#22c55e",
        shape: isAbove ? "arrowDown" : "arrowUp",
        text: isAbove ? "Sell" : "Buy",
        size: 2, // Трохи збільшили розмір стрілки
      };

      // Оновлюємо реф і одразу малюємо на графіку
      const updatedMarkers = [...markersRef.current, newMarker].sort(
        (a, b) => (a.time as number) - (b.time as number),
      );
      markersRef.current = updatedMarkers;
      activeSeries.setMarkers(updatedMarkers);
    };

    activeChart.subscribeClick(clickHandler);

    return () => {
      activeChart.unsubscribeClick(clickHandler);
    };
  }, [activeChart, activeSeries, isDrawingMode]);

  // Ця функція тепер безпечна і ніколи не викликатиме нескінченний цикл
  const restoreMarkers = useCallback(() => {
    if (activeSeries && markersRef.current.length > 0) {
      activeSeries.setMarkers(markersRef.current);
    }
  }, [activeSeries]);

  return {
    isDrawingMode,
    toggleDrawingMode,
    clearArrows,
    initDrawing,
    restoreMarkers,
  };
}
