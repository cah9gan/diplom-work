import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
          Интеллектуальное <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-yellow-400 drop-shadow-sm">предсказание рынка</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
          Анализируйте данные, выявляйте скрытые паттерны и принимайте решения на основе точных алгоритмов.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link 
            href="/register" 
            className="bg-linear-to-r from-orange-500 to-yellow-500 text-zinc-950 px-8 py-3.5 rounded-full font-bold text-lg hover:from-orange-400 hover:to-yellow-400 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
          >
            Начать работу
          </Link>
          <Link 
            href="/login" 
            className="bg-zinc-900/50 text-zinc-300 border border-zinc-700 px-8 py-3.5 rounded-full font-medium text-lg hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition-all shadow-sm backdrop-blur-md"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>

      {/* Блок с преимуществами (просто для красоты архитектуры) */}
      <div className="grid md:grid-cols-3 gap-8 mt-32">
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-orange-500/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">📊</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Точные данные</h3>
          <p className="text-zinc-400">Интеграция с ведущими API для получения котировок в реальном времени.</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-yellow-500/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🧠</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Машинное обучение</h3>
          <p className="text-zinc-400">Мощные алгоритмы бекенда для выявления неочевидных трендов.</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/80 hover:border-zinc-700 transition-colors group">
          <div className="text-4xl mb-6 bg-orange-400/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">⚡️</div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">Быстрая аналитика</h3>
          <p className="text-zinc-400">Мгновенный отклик и удобный интерфейс для анализа графиков.</p>
        </div>
      </div>
    </div>
  );
}