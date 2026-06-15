"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/src/lib/api-client";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post("/users", {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: "user",
      });

      setIsSubmitted(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Произошла ошибка при регистрации";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Экран успешной регистрации (в стиле темной темы)
  if (isSubmitted) {
    return (
      <div className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-black/50 border border-zinc-800 text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-3 text-white tracking-tight">Проверьте почту!</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Мы отправили вам письмо со ссылкой<br/>для создания пароля.
        </p>
        <Link 
          href="/login" 
          className="inline-block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm"
        >
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  // Сама форма регистрации
  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-black/50 border border-zinc-800">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          Создать аккаунт
        </h1>
        <p className="text-zinc-400">
          Присоединяйтесь к платформе для доступа к рынкам
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Имя и Фамилия в один ряд на средних экранах */}
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Имя</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="Александр"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Фамилия</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="Иванов"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
            placeholder="name@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:hover:shadow-lg mt-2"
        >
          {isLoading ? "Отправка..." : "Зарегистрироваться"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-zinc-400">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-orange-400 font-bold hover:text-orange-300 transition-colors">
          Войти
        </Link>
      </div>
    </div>
  );
}