"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  content?: string;
  source: string;
  sentiment: 'ANNOUNCEMENT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  publishedAt: string;
}

export default function AdminNewsPage() {
  const [announcements, setAnnouncements] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояния формы
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState("ANNOUNCEMENT");

  // Загружаем только системные новости
  const loadAnnouncements = async () => {
    try {
      // Используем публичный эндпоинт, но фильтруем только 'SYSTEM' на фронте
      const response = await fetch("http://localhost:3000/news");
      if (response.ok) {
        const data: NewsItem[] = await response.json();
        setAnnouncements(data.filter(item => item.source === 'SYSTEM'));
      }
    } catch (error) {
      console.error("Помилка завантаження новин", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadAnnouncements();
    };
    init();
  }, []);

  // Создание новости
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/news/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || undefined,
          sentiment: sentiment
        })
      });

      if (response.ok) {
        setTitle("");
        setContent("");
        setSentiment("ANNOUNCEMENT");
        await loadAnnouncements(); // Обновляем список
        alert("Оголошення успішно створено!");
      } else {
        const err = await response.json();
        alert(err.message || "Помилка при створенні");
      }
    } catch (error) {
      console.error("Помилка", error);
      alert("Сталася мережева помилка");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление новости
  const handleDelete = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити це оголошення?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/news/announcements/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadAnnouncements(); // Обновляем список
      } else {
        alert("Помилка при видаленні");
      }
    } catch (error) {
      console.error("Помилка", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Управління Оголошеннями</h1>
        <p className="text-zinc-400">Створюйте системні сповіщення, які будуть закріплені в стрічці новин.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЛЕВАЯ ЧАСТЬ: Форма создания */}
        <div className="lg:col-span-5 bg-zinc-900/80 backdrop-blur-md rounded-4xl shadow-xl shadow-black/30 border border-zinc-800 p-8 self-start">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">✍️</span> Нове оголошення
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Заголовок *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="Напр. Технічні роботи..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Детальний текст (Опціонально)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Опишіть деталі для користувачів..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Тип сповіщення</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none"
              >
                <option value="ANNOUNCEMENT">🔔 Важливе повідомлення</option>
                <option value="BULLISH">📈 Позитивна новина (Ріст)</option>
                <option value="BEARISH">📉 Негативна новина (Падіння)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="mt-4 w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Опублікування..." : "Опублікувати"}
            </button>
          </form>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Список системных объявлений */}
        <div className="lg:col-span-7 bg-zinc-900/80 backdrop-blur-md rounded-4xl shadow-xl shadow-black/30 border border-zinc-800 p-8 self-start">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-2xl">📢</span> Активні оголошення</div>
            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm py-1 px-3 rounded-full font-bold">
              {announcements.length}
            </span>
          </h2>
          
          <div className="overflow-y-auto max-h-125px pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-10 text-orange-500 animate-pulse font-bold">Завантаження...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-700 rounded-2xl">
                <p className="text-zinc-500">Немає активних системних повідомлень.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {announcements.map((news) => (
                  <li key={news.id} className="group p-5 bg-zinc-950 hover:bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-sm transition-all relative">
                    <div className="pr-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                          news.sentiment === 'BULLISH' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          news.sentiment === 'BEARISH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {news.sentiment}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(news.publishedAt).toLocaleString("uk-UA")}
                        </span>
                      </div>
                      <h4 className="font-bold text-zinc-200 text-lg mb-1">{news.title}</h4>
                      {news.content && <p className="text-sm text-zinc-500 line-clamp-2">{news.content}</p>}
                    </div>

                    {/* Кнопка удаления */}
                    <button 
                      onClick={() => handleDelete(news.id)}
                      className="absolute top-5 right-5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Видалити оголошення"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}