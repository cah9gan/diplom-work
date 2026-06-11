"use client";

import { useEffect, useState } from "react";

export default function AdminSymbolsPage() {
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  const [binanceHints, setBinanceHints] = useState<string[]>([]);
  
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [symbolsRes, hintsRes] = await Promise.all([
        // 👇 ИСПРАВЛЕНО: добавили { headers }, теперь запрос пройдет авторизацию!
        fetch("http://localhost:3000/market/symbols", { headers }), 
        fetch("http://localhost:3000/market/binance-symbols", { headers })
      ]);

      if (symbolsRes.ok) {
        const data = await symbolsRes.json();
        setActiveSymbols(data);
      }

      if (hintsRes.ok) {
        const hints = await hintsRes.json();
        setBinanceHints(hints);
      }
    } catch (err) {
      console.error("Ошибка при загрузке данных о монетах", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!newSymbol.trim()) {
      setError("Символ монеты обязателен");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/market/symbols", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: newSymbol.trim(),
          name: newName.trim() || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Ошибка при добавлении монеты");
      }

      setSuccess(`Монета ${newSymbol.toUpperCase()} успешно добавлена!`);
      setNewSymbol("");
      setNewName("");
      loadData(); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 НОВАЯ ФУНКЦИЯ: Обработчик удаления монеты
  const handleDelete = async (symbolToDelete: string) => {
    if (!confirm(`Вы уверены, что хотите прекратить отслеживание ${symbolToDelete}?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/market/symbols/${symbolToDelete.toLowerCase()}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Убираем из стейта локально или просто перезапрашиваем данные
        loadData();
        setSuccess(`Монета ${symbolToDelete} удалена.`);
      } else {
        alert("Ошибка при удалении монеты");
      }
    } catch (err) {
      console.error("Ошибка удаления", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Управление рынками</h1>
        <p className="text-slate-500">Добавляйте или удаляйте криптовалютные пары для отслеживания.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Форма добавления */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 self-start">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Добавить новую пару</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Торговая пара (напр. ADAUSDT)
              </label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toLowerCase())}
                list="binance-symbols"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                placeholder="Начните вводить..."
                required
              />
              <datalist id="binance-symbols">
                {binanceHints.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500 mt-1">Доступно пар на Binance: {binanceHints.length}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Понятное название (Опционально)
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="напр. Cardano"
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</div>}

            <button
              type="submit"
              disabled={isLoading || !newSymbol.trim()}
              className="mt-2 w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
            >
              {isLoading ? "Добавление..." : "Добавить пару"}
            </button>
          </form>
        </div>

        {/* Список текущих монет */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 self-start">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Отслеживаемые рынки ({activeSymbols.length})</h2>
          
          <div className="overflow-y-auto max-h-100 pr-2">
            {activeSymbols.length === 0 ? (
              <p className="text-slate-500 italic">Нет отслеживаемых монет.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activeSymbols.map((symbol) => (
                  <li key={symbol} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                    <span className="font-mono font-bold text-slate-800">{symbol}</span>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Активен</span>
                      
                      {/* 👇 Кнопка удаления */}
                      <button 
                        onClick={() => handleDelete(symbol)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
                        title="Удалить монету"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}