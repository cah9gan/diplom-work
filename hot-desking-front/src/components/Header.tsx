"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 👇 Добавляем стейт для проверки роли админа
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoggedIn(!!token);

    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        // Проверяем, совпадает ли роль с Admin (строка должна соответствовать твоему UserRole.Admin на бэке)
        setIsAdmin(user.role === "Admin" || user.role === "admin");
      } catch (e) {
        console.error("Ошибка парсинга данных пользователя", e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 shadow-sm shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        
        {/* Логотип */}
        <Link href="/" className="text-2xl font-black tracking-tighter group">
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-yellow-400 drop-shadow-sm group-hover:from-orange-400 group-hover:to-yellow-300 transition-all">
            MarketPredict
          </span>
        </Link>

        <nav className="flex gap-8 items-center">
          <Link 
            href="/" 
            className={`text-sm font-bold tracking-wide transition-colors hover:text-white ${pathname === "/" ? "text-orange-400" : "text-zinc-400"}`}
          >
            Главная
          </Link>
          
          {isLoggedIn && (
            <Link 
              href="/market" 
              className={`text-sm font-bold tracking-wide transition-colors hover:text-white ${pathname === "/market" ? "text-orange-400" : "text-zinc-400"}`}
            >
              Рынки
            </Link>
          )}

          {/* Кнопка: Показывается ТОЛЬКО если пользователь авторизован И он админ */}
          {isLoggedIn && isAdmin && (
            <Link 
              href="/admin/users" 
              className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-500/20 hover:text-orange-300 transition-all"
            >
              🔑 Админ-панель
            </Link>
          )}
          
          {isLoggedIn ? (
            <div className="flex items-center gap-5 ml-2">
              <Link 
                href="/profile" 
                className={`w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center transition-all border group ${pathname === "/profile" ? "border-orange-500" : "border-zinc-700 hover:border-orange-500/50"}`}
                title="Мой профиль"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-colors ${pathname === "/profile" ? "text-orange-400" : "text-zinc-400 group-hover:text-orange-400"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="bg-zinc-900 border border-zinc-700 hover:border-red-500/50 text-zinc-300 hover:text-red-400 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-2">
              <Link href="/login" className="text-sm font-bold text-zinc-300 hover:text-white transition-colors">
                Войти
              </Link>
              <Link href="/register" className="bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20">
                Регистрация
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}