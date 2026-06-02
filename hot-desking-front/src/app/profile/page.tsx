"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/api-client";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния для редактирования профиля
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Состояние для сообщений об успехе/ошибке сброса пароля
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile");
        setUser(response.data);
        // Заполняем поля для редактирования текущими данными
        setEditFirstName(response.data.firstName);
        setEditLastName(response.data.lastName);
      } catch (error) {
        console.error("Ошибка загрузки профиля", error);
        localStorage.removeItem("token"); 
        router.push("/login");            
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Функция сохранения нового имени
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
    } catch (error) {
      console.error("Ошибка при сохранении профиля", error);
      alert("Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  };

  // Функция запроса на сброс пароля
  const handleResetPassword = async () => {
    if (!user) return;
    setIsResetting(true);
    setResetMessage("");

    try {
      // Дергаем твой роут POST /profile/reset, который отправляет письмо
      await apiClient.post("/profile/reset", {
        email: user.email,
      });
      setResetMessage("Письмо со ссылкой для изменения пароля отправлено на вашу почту!");
    } catch (error) {
      console.error("Ошибка при запросе сброса пароля", error);
      setResetMessage("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-xl text-slate-500 animate-pulse">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Декоративная шапка профиля */}
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-10 left-8 w-24 h-24 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-3xl text-white font-bold shadow-md uppercase">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
        
        {/* Данные пользователя */}
        <div className="pt-14 pb-8 px-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-full max-w-md">
              
              {/* РЕЖИМ ПРОСМОТРА ИЛИ РЕДАКТИРОВАНИЯ */}
              {isEditing ? (
                <div className="flex flex-col gap-3 mb-2">
                  <input 
                    type="text" 
                    value={editFirstName} 
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Имя"
                  />
                  <input 
                    type="text" 
                    value={editLastName} 
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Фамилия"
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      {isSaving ? "Сохранение..." : "Сохранить"}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditFirstName(user?.firstName || "");
                        setEditLastName(user?.lastName || "");
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Редактировать профиль"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                </div>
              )}

              <p className="text-slate-500 mt-1">{user?.email}</p>
            </div>
            
            <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase">
              {user?.role}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6">
            <h2 className="text-lg font-bold mb-4">Безопасность</h2>
            
            <button 
              onClick={handleResetPassword}
              disabled={isResetting}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:text-gray-400"
            >
              {isResetting ? "Отправка..." : "Отправить ссылку для смены пароля"}
            </button>
            
            {/* Сообщение после нажатия на кнопку сброса */}
            {resetMessage && (
              <p className={`mt-2 text-sm ${resetMessage.includes("ошибка") ? "text-red-600" : "text-green-600"}`}>
                {resetMessage}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}