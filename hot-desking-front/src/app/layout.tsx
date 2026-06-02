import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/src/components/Header"; // Импортируем нашу шапку

const inter = Inter({ subsets: ["latin"] });

// Это мета-теги, которые пойдут в <head> (название вкладки в браузере)
export const metadata: Metadata = {
  title: "Market Predict",
  description: "Аналитика и предсказание рыночных трендов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        {/* Шапка будет на всех страницах */}
        <Header />
        
        {/* А здесь будут меняться сами страницы (Главная, Логин, Регистрация) */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}