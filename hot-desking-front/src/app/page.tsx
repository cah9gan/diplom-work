"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Оборачиваем в асинхронную функцию, чтобы избежать синхронного обновления состояния
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
          Інтелектуальне <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-yellow-400 drop-shadow-sm">передбачення ринку</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
          Аналізуйте дані, виявляйте приховані патерни та приймайте рішення на основі точних алгоритмів.
        </p>
        
        {/* Блок с кнопками */}
        <div className="flex justify-center gap-4 min-h-[56px]">
          {isLoading ? (
            // Невидимая заглушка, чтобы верстка не прыгала во время проверки токена
            <div className="opacity-0">Завантаження...</div>
          ) : isLoggedIn ? (
            // Что видит авторизованный пользователь
            <Link 
              href="/market" 
              className="bg-linear-to-r from-orange-500 to-yellow-500 text-zinc-950 px-8 py-3.5 rounded-full font-bold text-lg hover:from-orange-400 hover:to-yellow-400 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
            >
              Перейти до ринків &rarr;
            </Link>
          ) : (
            // Что видит гость
            <>
              <Link 
                href="/register" 
                className="bg-linear-to-r from-orange-500 to-yellow-500 text-zinc-950 px-8 py-3.5 rounded-full font-bold text-lg hover:from-orange-400 hover:to-yellow-400 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
              >
                Почати роботу
              </Link>
              <Link 
                href="/login" 
                className="bg-zinc-900/50 text-zinc-300 border border-zinc-700 px-8 py-3.5 rounded-full font-medium text-lg hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition-all shadow-sm backdrop-blur-md"
              >
                Увійти в акаунт
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Блок с преимуществами */}
      <div className="grid md:grid-cols-3 gap-8 mt-32">
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-orange-500/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">📊</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Точні дані</h3>
          <p className="text-zinc-400">Інтеграція з провідними API для отримання котирувань у реальному часі.</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-yellow-500/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🧠</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Машинне навчання</h3>
          <p className="text-zinc-400">Потужні алгоритми бекенду для виявлення неочевидних трендів.</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-orange-400/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">⚡️</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Швидка аналітика</h3>
          <p className="text-zinc-400">Миттєвий відгук та зручний інтерфейс для аналізу графіків.</p>
        </div>
      </div>
    </div>
  );
}