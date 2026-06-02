"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/src/lib/api-client";

export function SetPasswordForm() {
  const searchParams = useSearchParams();
  
  // Достаем параметры прямо из URL
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Базовая проверка, что пароли совпадают
    if (password !== confirmPassword) {
      setError("Пароли не совпадают!");
      return;
    }

    setIsLoading(true);

    try {
      // Отправляем данные на твой NestJS. 
      // Убедись, что ключи объекта совпадают с твоим DTO на бэкенде!
      await apiClient.post("/profile/password", {
        email: email,
        code: code,
        password: password,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Неверный код или ссылка устарела";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Если кто-то зашел просто на /set-password без ссылки из письма
  if (!email || !code) {
    return (
      <div className="text-center text-red-600">
        Неверная ссылка. Пожалуйста, перейдите по ссылке из письма.
      </div>
    );
  }

  // Если всё прошло успешно
  if (isSuccess) {
    return (
      <div className="text-center text-green-600">
        <h2 className="text-xl font-bold mb-2">Успешно!</h2>
        <p>Ваш пароль сохранен. Теперь вы можете войти в систему.</p>
        {/* Позже мы добавим сюда кнопку перехода на страницу логина */}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">
          {error}
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mb-4">
        Установка пароля для: <br/> <b>{email}</b>
      </div>

      <input 
        type="password" 
        placeholder="Придумайте пароль" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
        minLength={6} // Минимальная длина пароля
      />
      <input 
        type="password" 
        placeholder="Повторите пароль" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={`p-2 rounded text-white transition-colors ${
          isLoading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isLoading ? "Сохранение..." : "Сохранить и войти"}
      </button>
    </form>
  );
}