"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Проверяем наличие токена
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Если токена нет, выгоняем на страницу логина
      router.push("/login");
    } else {
      // Если есть, разрешаем отрисовку
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthorized(true);
    }
  }, [router]);

  // Пока идет проверка (доли секунды), можно показывать пустой экран или лоадер,
  // чтобы не "моргал" интерфейс маркета перед перенаправлением
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Проверка доступа...</div>
      </div>
    );
  }

  // Если всё ок, рендерим вложенные страницы (page.tsx или [symbol]/page.tsx)
  return <>{children}</>;
}