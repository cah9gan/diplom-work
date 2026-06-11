"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    
    if (!token || !userString) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userString);
      if (user.role === "Admin" || user.role === "admin") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAuthorized(true);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-amber-600 font-medium">Проверка прав администратора...</div>
      </div>
    );
  }

  // Навигация для админки
  const navLinks = [
    { href: "/admin/users", label: "Пользователи" },
    { href: "/admin/symbols", label: "Управление монетами" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      {/* Боковая панель (или верхняя на мобилках) */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 md:min-h-screen">
        <h2 className="text-xl font-bold text-white mb-6">Админ-панель</h2>
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-blue-600 text-white font-medium"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}