"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/api-client";

// Добавили поле twoFactorStatus
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  twoFactorStatus: "active" | "inactive";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
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
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile");
        setUser(response.data);
        setEditFirstName(response.data.firstName);
        setEditLastName(response.data.lastName);
      } catch {
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
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

  if (isLoading) return <div className="text-center py-20 animate-pulse">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-zinc-900/90 backdrop-blur-xl rounded-4xl shadow-2xl shadow-black/50 border border-zinc-800 overflow-hidden">
        <div className="bg-linear-to-r from-orange-600 via-orange-500 to-yellow-500 h-40 relative">
          <div className="absolute -bottom-12 left-10 w-28 h-28 bg-zinc-900 rounded-full p-1.5 shadow-lg">
            <div className="w-full h-full bg-linear-to-br from-orange-500 to-yellow-400 rounded-full flex items-center justify-center text-4xl text-zinc-950 font-black uppercase tracking-tight">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-10">
          {/* Имя и Роль */}
          <div className="flex justify-between items-start mb-6">
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

          {/* Безопасность */}
          <div className="border-t border-zinc-800/80 pt-8 mt-4">
            <h2 className="text-xl font-bold text-white mb-5">Безопасность</h2>
            
            {/* Переключатель 2FA */}
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