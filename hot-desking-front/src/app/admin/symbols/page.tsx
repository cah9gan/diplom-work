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
      setError("Символ монети обов'язковий");
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
        throw new Error(errData.message || "Помилка при додаванні монети");
      }

      setSuccess(`Монета ${newSymbol.toUpperCase()} успішно додана!`);
      setNewSymbol("");
      setNewName("");
      loadData(); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Виникла невідома помилка");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 НОВАЯ ФУНКЦИЯ: Обработчик удаления монеты
  const handleDelete = async (symbolToDelete: string) => {
    if (!confirm(`Ви впевнені, що хочете припинити відстеження ${symbolToDelete}?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/market/symbols/${symbolToDelete.toLowerCase()}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Убираем из стейта локально или просто перезапрашиваем данные
        loadData();
        setSuccess(`Монета ${symbolToDelete} видалена.`);
      } else {
        alert("Помилка при видаленні монети");
      }
    } catch (err) {
      console.error("Ошибка удаления", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Управління ринками</h1>
        <p className="text-zinc-400">Додавайте або видаляйте криптовалютні пари для відстеження.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Форма добавления */}
        <div className="lg:col-span-5 bg-zinc-900/80 backdrop-blur-md rounded-4xl shadow-xl shadow-black/30 border border-zinc-800 p-8 self-start">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2"><span className="text-2xl">✨</span> Додати нову пару</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Торгова пара (напр. ADAUSDT)
              </label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toLowerCase())}
                list="binance-symbols"
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none uppercase transition-all placeholder:text-zinc-600"
                placeholder="Почніть вводити..."
                required
              />
              <datalist id="binance-symbols">
                {binanceHints.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>
              <p className="text-xs text-zinc-500 mt-2">Доступно пар на Binance: {binanceHints.length}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Зрозуміла назва (Опціонально)
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
                placeholder="Напр. Cardano"
              />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}
            {success && <div className="text-sm text-green-400 bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex items-center gap-2"><span>✅</span> {success}</div>}

            <button
              type="submit"
              disabled={isLoading || !newSymbol.trim()}
              className="mt-2 w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:hover:shadow-md disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500"
            >
              {isLoading ? "Додавання..." : "Додати пару"}
            </button>
          </form>
        </div>

        {/* Список текущих монет */}
        <div className="lg:col-span-7 bg-zinc-900/80 backdrop-blur-md rounded-4xl shadow-xl shadow-black/30 border border-zinc-800 p-8 self-start">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-2xl">📈</span> Відстежувані ринки</div>
            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm py-1 px-3 rounded-full font-bold">{activeSymbols.length}</span>
          </h2>
          
          <div className="overflow-y-auto max-h-150 pr-2 custom-scrollbar">
            {activeSymbols.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-700 rounded-2xl">
                <p className="text-zinc-500">Немає відстежуваних монет.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {activeSymbols.map((symbol) => (
                  <li key={symbol} className="group flex justify-between items-center p-4 bg-zinc-950 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-orange-500 font-bold text-sm">
                        {symbol.substring(0, 1)}
                      </div>
                      <span className="font-bold text-zinc-100 text-lg tracking-tight">{symbol}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Активний
                      </span>
                      
                      {/* 👇 Кнопка удаления */}
                      <button 
                        onClick={() => handleDelete(symbol)}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Видалити монету"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
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