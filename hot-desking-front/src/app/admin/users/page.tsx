"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  isBanned?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для модального окна пополнения
  const [depositUserId, setDepositUserId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);

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
      console.error("Не удалось загрузить пользователей", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadUsers();
    };
    init();
  }, []);

  const handleBan = async (id: string, currentBanStatus: boolean) => {
    if (!confirm(`Вы уверены, что хотите ${currentBanStatus ? "разблокировать" : "заблокировать"} этого пользователя?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/users/${id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: "Действие администратора" 
        })
      });

      if (response.ok) {
        loadUsers();
      } else {
        alert("Ошибка при выполнении операции");
      }
    } catch (error) {
      console.error("Ошибка при блокировке", error);
    }
  };

  // Обработчик отправки формы пополнения
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositUserId) return;

    const numAmount = Number(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Введите корректную сумму больше нуля");
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
        alert("Баланс успешно пополнен!");
        setDepositUserId(null); // Закрываем модалку
        setDepositAmount("");   // Очищаем инпут
      } else {
        const err = await response.json();
        alert(err.message || "Ошибка при пополнении");
      }
    } catch (error) {
      console.error("Ошибка при пополнении", error);
      alert("Сетевая ошибка при пополнении");
    } finally {
      setIsDepositing(false);
    }
  };

  // Ищем email выбранного пользователя для красивого отображения в модалке
  const selectedUser = users.find(u => u.id === depositUserId);

  return (
    <div className="max-w-6xl mx-auto py-4 relative">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Пользователи</h1>
        <p className="text-zinc-400">Инструментарий администратора для мониторинга аккаунтов системы</p>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-4xl shadow-2xl shadow-black/50 border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-orange-500 font-bold animate-pulse">Загрузка данных...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase tracking-wider bg-zinc-950/80 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-8 py-5">ID / Идентификатор</th>
                  <th className="px-8 py-5">Логин</th>
                  <th className="px-8 py-5">Роль</th>
                  <th className="px-8 py-5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {users.map((user) => (
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
                            {/* Кнопка пополнения */}
                            <button
                              onClick={() => setDepositUserId(user.id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white"
                            >
                              ПОПОЛНИТЬ
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
                              {user.isBanned ? "РАЗБЛОКИРОВАТЬ" : "ЗАБЛОКИРОВАТЬ"}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">Система</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно пополнения */}
      {depositUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Пополнение баланса</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Вы собираетесь начислить USDT пользователю <span className="text-orange-400 font-bold">{selectedUser?.email}</span>
            </p>

            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Сумма пополнения (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-600"
                  />
                  <span className="absolute right-4 top-3.5 text-zinc-500 font-bold">USDT</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDepositUserId(null);
                    setDepositAmount("");
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isDepositing || !depositAmount}
                  className="flex-1 bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDepositing ? "ОБРАБОТКА..." : "НАЧИСЛИТЬ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}