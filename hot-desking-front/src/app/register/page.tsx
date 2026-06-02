"use client";

import { useState } from "react";
import { apiClient } from "@/src/lib/api-client"; // Подключаем наш настроенный Axios

export default function RegisterForm() {
  // Состояния для хранения того, что вводит пользователь
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  // Состояния для интерфейса
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Крутилка/блокировка кнопки
  const [error, setError] = useState<string | null>(null); // Ошибки от бэкенда

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true); // Блокируем кнопку на время запроса
    setError(null);     // Очищаем старые ошибки

    try {
      // Отправляем реальный POST-запрос на твой NestJS
      // В объекте передаем данные ровно так, как ждет твой CreateUserDTO
      await apiClient.post("/users", {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: "user", // Если в твоем DTO роль обязательна, передаем её. Если нет - можно удалить эту строку
      });

      // Если запрос прошел успешно (статус 200/201), показываем сообщение
      setIsSubmitted(true);
      
    } catch (err: any) {
      // Если бэкенд вернул ошибку (например, email уже занят)
      // Достаем текст ошибки из ответа NestJS
      const errorMessage = err.response?.data?.message || "Произошла ошибка при регистрации";
      setError(errorMessage);
    } finally {
      // В любом случае (успех или ошибка) снимаем блокировку с кнопки
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold mb-2 text-green-600">Проверьте почту!</h2>
        <p className="text-gray-600">Мы отправили вам письмо со ссылкой для создания пароля.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Если есть ошибка, показываем её красным цветом */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <input 
        type="text" 
        placeholder="Имя" 
        value={firstName} // Привязываем к состоянию
        onChange={(e) => setFirstName(e.target.value)} // Обновляем состояние при вводе
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      <input 
        type="text" 
        placeholder="Фамилия" 
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      <input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
        required 
      />
      
      <button 
        type="submit" 
        disabled={isLoading} // Кнопка выключена, пока идет запрос
        className={`p-2 rounded text-white transition-colors ${
          isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Отправка..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}