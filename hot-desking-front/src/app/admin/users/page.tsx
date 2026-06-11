"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  isBanned?: boolean; // подстрой под свойства своей DTO, если у тебя по-другому
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Функция загрузки пользователей с бэка
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  // Функция для вызова твоего метода ban(id)
  const handleBan = async (id: string, currentBanStatus: boolean) => {
    if (!confirm(`Вы уверены, что хотите ${currentBanStatus ? "разблокировать" : "заблокировать"} этого пользователя?`)) return;

    try {
      const token = localStorage.getItem("token");
      // Шлем POST запрос на твой эндпоинт :id/ban
      const response = await fetch(`http://localhost:3000/users/${id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          // Сюда можно передать причину, если твоя BanUserDTO её требует, например reason: "Нарушение правил"
          reason: "Действие администратора" 
        })
      });

      if (response.ok) {
        // Перезагружаем список, чтобы увидеть изменения
        loadUsers();
      } else {
        alert("Ошибка при выполнении операции");
      }
    } catch (error) {
      console.error("Ошибка при блокировке", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Управление пользователями</h1>
          <p className="text-sm text-slate-500">Инструментарий администратора для мониторинга системы</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка данных...</div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Email / Логин</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        user.role === "Admin" || user.role === "admin"
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== "Admin" && user.role !== "admin" ? (
                        <button
                          onClick={() => handleBan(user.id, !!user.isBanned)}
                          className={`px-3 py-1 rounded text-xs font-medium border transition-all ${
                            user.isBanned
                              ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white"
                              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white"
                          }`}
                        >
                          {user.isBanned ? "Разбанить" : "Забанить"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Системный админ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}