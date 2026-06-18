"use client";

import { useEffect, useState } from "react";
import { NewsCard, NewsItem } from "@/src/components/news/NewCard"; // Перевір шлях до компонента!

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Запит доступний без токена, оскільки це публічний роут на бекенді
        const response = await fetch("http://localhost:3000/news");
        
        if (!response.ok) throw new Error("Не вдалося завантажити новини");
        
        const data = await response.json();
        setNews(data);
      } catch {
        setError("Помилка з'єднання з сервером. Спробуйте пізніше.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Інформаційний <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-yellow-400">Хаб</span>
        </h1>
        <p className="text-lg text-zinc-400">
          Офіційні повідомлення платформи та найсвіжіші новини крипторинку в реальному часі.
        </p>
      </div>

      {isLoading ? (
        // Скелетон загрузки
        <div className="flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-zinc-900/50 rounded-3xl border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl text-center font-medium">
          {error}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 font-medium bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
          Стрічка новин порожня.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}
    </div>
  );
}