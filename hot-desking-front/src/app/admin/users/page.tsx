"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  isBanned?: boolean;
}

// Интерфейс для логов (транзакций)
interface TransactionLog {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT';
  amount: string;
  price: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 Состояние для поиска
  const [searchEmail, setSearchEmail] = useState("");

  // Состояния для пополнения
  const [depositUserId, setDepositUserId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);

  // 👇 Состояния для просмотра логов
  const [logsUserId, setLogsUserId] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<TransactionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Оборачиваем вызов в асинхронную функцию, чтобы перенести его в микротаски
    const init = async () => {
      await loadUsers();
    };
    
    init();
  }, []);

  const handleBan = async (id: string, currentBanStatus: boolean) => {
    if (!confirm(`Ви впевнені, що хочете ${currentBanStatus ? "розблокувати" : "заблокувати"} цього користувача?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/users/${id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "Дія адміністратора" })
      });

      if (response.ok) {
        loadUsers();
      } else {
        alert("Помилка при виконанні операції");
      }
    } catch (error) {
      console.error("Ошибка при блокировке", error);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositUserId) return;

    const numAmount = Number(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Введіть коректну суму більше нуля");
      return;
    }

    setIsDepositing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/trade/deposit/${depositUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numAmount })
      });

      if (response.ok) {
        alert("Баланс успішно поповнено!");
        setDepositUserId(null);
        setDepositAmount("");
      } else {
        const err = await response.json();
        alert(err.message || "Помилка при поповненні");
      }
    } catch (error) {
      console.error("Ошибка при пополнении", error);
      alert("Мережева помилка при поповненні");
    } finally {
      setIsDepositing(false);
    }
  };

  // 👇 НОВАЯ ФУНКЦИЯ: Загрузка логов пользователя
  const handleViewLogs = async (userId: string) => {
    setLogsUserId(userId);
    setIsLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/trade/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserLogs(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке логов", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 👇 Фильтрация пользователей на основе поиска
  const filteredUsers = users.filter((user) => 
    user.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === depositUserId || u.id === logsUserId);

  return (
    <div className="max-w-6xl mx-auto py-4 relative">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Користувачі</h1>
          <p className="text-zinc-400">Інструментарій адміністратора для моніторингу акаунтів системи</p>
        </div>
        
        {/* 👇 Поле поиска */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Пошук за email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-600 shadow-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-4 top-3.5 text-zinc-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-black/50 border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-orange-500 font-bold animate-pulse">Завантаження даних...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase tracking-wider bg-zinc-950/80 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-8 py-5">ID / Ідентифікатор</th>
                  <th className="px-8 py-5">Логін</th>
                  <th className="px-8 py-5">Роль</th>
                  <th className="px-8 py-5 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-zinc-500">
                      Користувачів не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-8 py-5 font-mono text-xs text-zinc-600">{user.id}</td>
                      <td className="px-8 py-5 font-bold text-zinc-200">{user.email}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border ${
                          user.role.toLowerCase() === "admin"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-3">
                          {user.role.toLowerCase() !== "admin" ? (
                            <>
                              {/* 👇 Кнопка ЛОГИ */}
                              <button
                                onClick={() => handleViewLogs(user.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold border transition-all bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white"
                              >
                                ЛОГИ
                              </button>
                              
                              {/* Кнопка пополнения */}
                              <button
                                onClick={() => setDepositUserId(user.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold border transition-all bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white"
                              >
                                ПОПОВНИТИ
                              </button>
                              
                              {/* Кнопка бана */}
                              <button
                                onClick={() => handleBan(user.id, !!user.isBanned)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                  user.isBanned
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-zinc-950"
                                    : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                                }`}
                              >
                                {user.isBanned ? "РОЗБЛОКУВАТИ" : "ЗАБЛОКУВАТИ"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">Система</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно пополнения */}
      {depositUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Поповнення балансу</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Ви збираєтесь нарахувати USDT користувачу <span className="text-orange-400 font-bold">{selectedUser?.email}</span>
            </p>

            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Сума (USDT)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-orange-500 transition-all placeholder:text-zinc-600"
                  />
                  <span className="absolute right-4 top-3.5 text-zinc-500 font-bold">USDT</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setDepositUserId(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-colors">
                  Скасувати
                </button>
                <button type="submit" disabled={isDepositing || !depositAmount} className="flex-1 bg-linear-to-r from-orange-500 to-yellow-500 text-zinc-950 font-black py-3.5 rounded-xl transition-all disabled:opacity-50">
                  {isDepositing ? "ОБРОБКА..." : "НАРАХУВАТИ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👇 НОВОЕ: Модальное окно логов транзакций */}
      {logsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Історія операцій</h3>
                <p className="text-sm text-zinc-400">Користувач: <span className="text-orange-400 font-bold">{selectedUser?.email}</span></p>
              </div>
              <button onClick={() => setLogsUserId(null)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border border-zinc-800 rounded-2xl bg-zinc-950">
              {isLoadingLogs ? (
                <div className="p-10 text-center text-purple-400 font-bold animate-pulse">Завантаження логів...</div>
              ) : userLogs.length === 0 ? (
                <div className="p-10 text-center text-zinc-500">У користувача поки немає операцій.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-zinc-900 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Дата</th>
                      <th className="px-6 py-4">Тип</th>
                      <th className="px-6 py-4 text-right">Сума / Ціна</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {userLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-800/50">
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
                            log.type === 'DEPOSIT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            log.type === 'BUY' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {log.type === 'DEPOSIT' ? 'Поповнення' : log.type === 'BUY' ? 'Купівля' : 'Продаж'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-bold ${log.type === 'SELL' ? 'text-zinc-300' : 'text-white'}`}>
                            {log.type === 'DEPOSIT' ? '+' : ''}{Number(log.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </div>
                          {log.type !== 'DEPOSIT' && (
                            <div className="text-xs text-zinc-500 mt-0.5">
                              за ціною ${log.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}