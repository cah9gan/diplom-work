"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      const decodedUser = parseJwt(token);

      if (decodedUser && decodedUser.role && decodedUser.role.toLowerCase() === "admin") {
        setIsAuthorized(true);
      } else {
        router.push("/");
      }
    };

    verifyAdmin();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-orange-500 font-bold tracking-widest uppercase text-sm">
          Перевірка прав...
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin/users", label: "Користувачі", icon: "👥" },
    { href: "/admin/symbols", label: "Управління монетами", icon: "📈" },
  ];

  return (
    <div className="bg-zinc-950 min-h-[calc(100vh-80px)] flex flex-col md:flex-row">
      {/* Боковая панель */}
      <aside className="w-full md:w-72 bg-zinc-900/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-800/80 p-6 md:min-h-full">
        <h2 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3 opacity-90">
          <span className="text-orange-500">⚙️</span> Система
        </h2>
        
        <nav className="flex flex-col gap-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3.5 rounded-2xl transition-all font-bold text-sm flex items-center gap-3 ${
                  isActive
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/5"
                    : "text-zinc-400 border border-transparent hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-6 md:p-10 bg-zinc-950">
        {children}
      </main>
    </div>
  );
}