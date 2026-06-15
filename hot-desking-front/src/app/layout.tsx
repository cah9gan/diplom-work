import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/src/components/Header"; // Импортируем нашу шапку

const inter = Inter({ subsets: ["latin"] });

// Это мета-теги, которые пойдут в <head> (название вкладки в браузере)
export const metadata: Metadata = {
  title: "Market Predict",
  description: "Аналітика та передбачення ринкових трендів",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.className} bg-linear-to-br from-zinc-950 to-zinc-900 text-zinc-100 min-h-screen flex flex-col selection:bg-orange-500/30 selection:text-orange-200`}>
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