"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-wider hover:text-blue-400 transition-colors">
          📈 Market<span className="text-blue-500">Predict</span>
        </Link>

        <nav className="flex gap-6 items-center">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Главная
          </Link>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              
              {/* 👇 ДОБАВИЛИ КНОПКУ РЫНКА СЮДА */}
              <Link href="/market" className="font-medium hover:text-blue-400 transition-colors">
                Рынки
              </Link>

              {/* Круглая иконка профиля */}
              <Link 
                href="/profile" 
                className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors border border-slate-600"
                title="Мой профиль"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="bg-red-600/10 text-red-500 px-4 py-2 rounded border border-red-600/50 hover:bg-red-600 hover:text-white transition-all"
              >
                Выйти
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-400 transition-colors">
                Войти
              </Link>
              <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}