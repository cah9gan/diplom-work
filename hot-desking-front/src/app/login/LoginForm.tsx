"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Хук для навигации
import { apiClient } from "@/src/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Отправляем запрос на твой AuthController
      const response = await apiClient.post("/auth/login", {
        email: email,
        password: password,
      });

      // Бекенд возвращает профиль + токен (согласно твоему AccessDTO)
      const token = response.data.token;
      
      // 1. Сохраняем токен в браузере
      localStorage.setItem("token", token);
      
      // Опционально: можно сохранить и данные юзера, чтобы сразу их показывать
      localStorage.setItem("user", JSON.stringify(response.data));

      // 2. Перенаправляем пользователя на главную страницу (или в личный кабинет)
      router.push("/");
      
    } catch (err: any) {
      // Если пароль неверный, бекенд выбросит UnauthorizedException
      const errorMessage = err.response?.data?.message || "Неверный email или пароль";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">
          {error}
        </div>
      )}

      <input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      <input 
        type="password" 
        placeholder="Пароль" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={`p-2 rounded text-white transition-colors mt-2 ${
          isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}