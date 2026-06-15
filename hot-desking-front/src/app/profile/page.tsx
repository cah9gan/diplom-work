"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/api-client";

// Интерфейсы пользователя
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  twoFactorStatus: "active" | "inactive";
}

// Интерфейсы портфеля
interface PortfolioPosition {
  id: string;
  symbol: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  profitPercentage: number;
}

interface UserPortfolio {
  walletBalance: number;
  totalEquity: number;
  totalUnrealizedPnL: number;
  activePositions: PortfolioPosition[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Состояния безопасности
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Делаем два запроса параллельно для скорости
        const [profileRes, portfolioRes] = await Promise.all([
          apiClient.get("/profile"),
          apiClient.get("/trade/portfolio").catch(() => ({ data: null })) // Защита от ошибки, если кошелька еще нет
        ]);

        setUser(profileRes.data);
        setEditFirstName(profileRes.data.firstName);
        setEditLastName(profileRes.data.lastName);
        
        if (portfolioRes.data) {
          setPortfolio(portfolioRes.data);
        }
      } catch {
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await apiClient.patch("/profile", {
        firstName: editFirstName,
        lastName: editLastName,
        email: user.email,
      });
      setUser({ ...user, firstName: editFirstName, lastName: editLastName });
      setIsEditing(false);
    } catch {
      alert("Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    setIsUpdating2FA(true);
    
    const newStatus = user.twoFactorStatus === "active" ? "inactive" : "active";
    
    try {
      await apiClient.patch("/profile/2fa", { status: newStatus });
      setUser({ ...user, twoFactorStatus: newStatus });
    } catch {
      alert("Не удалось обновить настройки 2FA");
    } finally {
      setIsUpdating2FA(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    setIsResetting(true);
    setResetMessage("");
    try {
      await apiClient.post("/profile/reset", { email: user.email });
      setResetMessage("Ссылка для смены пароля отправлена на почту!");
    } catch {
      setResetMessage("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 animate-pulse text-orange-500 font-bold uppercase tracking-widest">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-zinc-900/90 backdrop-blur-xl rounded-4xl shadow-2xl shadow-black/50 border border-zinc-800 overflow-hidden">
        {/* Шапка профиля */}
        <div className="bg-linear-to-r from-orange-600 via-orange-500 to-yellow-500 h-40 relative">
          <div className="absolute -bottom-12 left-10 w-28 h-28 bg-zinc-900 rounded-full p-1.5 shadow-lg">
            <div className="w-full h-full bg-linear-to-br from-orange-500 to-yellow-400 rounded-full flex items-center justify-center text-4xl text-zinc-950 font-black uppercase tracking-tight">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-10">
          {/* Имя и Роль */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
            <div>
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="border border-zinc-700 bg-zinc-950 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none w-40" />
                    <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="border border-zinc-700 bg-zinc-950 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none w-40" />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-zinc-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors">Сохранить</button>
                    <button onClick={() => setIsEditing(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                  {user?.firstName} {user?.lastName} 
                  <button onClick={() => setIsEditing(true)} className="text-zinc-600 hover:text-orange-400 transition-colors" title="Редактировать">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                  </button>
                </h1>
              )}
              <p className="text-zinc-400 mt-1 text-lg">{user?.email}</p>
            </div>
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{user?.role}</span>
          </div>

          {/* 👇 НОВЫЙ БЛОК: ПОРТФЕЛЬ */}
          {portfolio && (
            <div className="border-t border-zinc-800/80 pt-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-5">Финансовая сводка</h2>
              
              {/* Общие цифры */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-5">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Свободно (USDT)</p>
                  <p className="text-2xl font-black text-white">${portfolio.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                
                <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-5">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Капитал (С активами)</p>
                  <p className="text-2xl font-black text-white">${portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                
                <div className={`bg-zinc-950/50 rounded-2xl border p-5 ${portfolio.totalUnrealizedPnL >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Прибыль / Убыток</p>
                  <p className={`text-2xl font-black ${portfolio.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.totalUnrealizedPnL > 0 ? '+' : ''}{portfolio.totalUnrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </p>
                </div>
              </div>

              {/* Список активов */}
              <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Открытые позиции</h3>
                </div>
                
                {portfolio.activePositions.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">У вас пока нет купленных монет.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/30">
                        <tr>
                          <th className="px-5 py-3 font-medium">Актив</th>
                          <th className="px-5 py-3 font-medium text-right">Количество</th>
                          <th className="px-5 py-3 font-medium text-right">Цена входа / Текущая</th>
                          <th className="px-5 py-3 font-medium text-right">PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {portfolio.activePositions.map((pos) => {
                          const isProfit = pos.profit >= 0;
                          return (
                            <tr key={pos.id} className="hover:bg-zinc-800/20 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-white">{pos.symbol.replace('USDT', '')}</div>
                                <div className="text-xs text-zinc-500">USDT</div>
                              </td>
                              <td className="px-5 py-4 text-right font-medium text-zinc-300">
                                {pos.amount}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="text-zinc-400">${pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                <div className="font-bold text-white">${pos.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                  {isProfit ? '+' : ''}{pos.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                </div>
                                <div className={`text-xs ${isProfit ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                  {isProfit ? '+' : ''}{pos.profitPercentage.toFixed(2)}%
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Безопасность */}
          <div className="border-t border-zinc-800/80 pt-8 mt-4">
            <h2 className="text-xl font-bold text-white mb-5">Безопасность</h2>
            
            <div className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 mb-5">
              <div>
                <p className="font-semibold text-zinc-200">Двухфакторная аутентификация</p>
                <p className="text-sm text-zinc-500 mt-0.5">{user?.twoFactorStatus === 'active' ? 'Дополнительная защита включена' : 'Повысьте безопасность аккаунта'}</p>
              </div>
              <button 
                onClick={handleToggle2FA}
                disabled={isUpdating2FA}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-orange-500 ${user?.twoFactorStatus === 'active' ? 'bg-orange-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${user?.twoFactorStatus === 'active' ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <button onClick={handleResetPassword} disabled={isResetting} className="text-orange-400 font-medium hover:text-orange-300 transition-colors">
              {isResetting ? "Отправка..." : "Сбросить пароль"}
            </button>
            {resetMessage && <p className="mt-3 text-sm text-green-400 bg-green-500/10 p-3 rounded-xl border border-green-500/20">{resetMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}