"use client";

import Link from "next/link";

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  url?: string;
  source: 'SYSTEM' | 'CRYPTOPANIC';
  sentiment: 'ANNOUNCEMENT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  publishedAt: string;
}

export function NewsCard({ news }: { news: NewsItem }) {
  const isSystem = news.source === 'SYSTEM';

  const sentimentConfig = {
    ANNOUNCEMENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    BULLISH: "bg-green-500/10 text-green-400 border-green-500/20",
    BEARISH: "bg-red-500/10 text-red-400 border-red-500/20",
    NEUTRAL: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  const sentimentLabels = {
    ANNOUNCEMENT: "Важливо",
    BULLISH: "Ріст ↗",
    BEARISH: "Падіння ↘",
    NEUTRAL: "Новина",
  };

  const formattedDate = new Date(news.publishedAt).toLocaleString("uk-UA", {
    day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"
  });

  // Визначаємо посилання (беремо url, або content, якщо url порожній)
  const externalLink = news.url || news.content;

  return (
    <div className={`p-6 rounded-3xl border transition-all ${
      isSystem 
        ? "bg-linear-to-br from-blue-900/20 to-zinc-900 border-blue-500/30 shadow-lg shadow-blue-500/5" 
        : "bg-zinc-900/60 backdrop-blur-md border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80"
    }`}>
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
            isSystem ? "bg-blue-500 text-zinc-950" : "bg-orange-500/20 text-orange-400"
          }`}>
            {isSystem ? "⚡" : "FL"}
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {isSystem ? "Офіційне повідомлення" : "ForkLog UA"}
            </div>
            <div className="text-xs text-zinc-600">{formattedDate}</div>
          </div>
        </div>
        
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${sentimentConfig[news.sentiment]}`}>
          {sentimentLabels[news.sentiment]}
        </span>
      </div>

      <h3 className={`text-xl font-bold mb-3 ${isSystem ? "text-white" : "text-zinc-200"}`}>
        {news.title}
      </h3>

      {/* Якщо це системна новина - показуємо текст. Якщо зовнішня - кнопку-посилання */}
      {isSystem ? (
        news.content && <p className="text-zinc-400 leading-relaxed text-sm">{news.content}</p>
      ) : (
        externalLink && (
          <Link 
            href={externalLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Читати в джерелі
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        )
      )}
    </div>
  );
}