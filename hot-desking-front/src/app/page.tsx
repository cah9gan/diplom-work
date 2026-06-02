import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-6 text-slate-900">
          Интеллектуальное <span className="text-blue-600">предсказание рынка</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          Анализируйте данные, выявляйте скрытые паттерны и принимайте решения на основе точных алгоритмов.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link 
            href="/register" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Начать работу
          </Link>
          <Link 
            href="/login" 
            className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>

      {/* Блок с преимуществами (просто для красоты архитектуры) */}
      <div className="grid md:grid-cols-3 gap-8 mt-24">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">Точные данные</h3>
          <p className="text-slate-600">Интеграция с ведущими API для получения котировок в реальном времени.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-4">🧠</div>
          <h3 className="text-xl font-bold mb-2">Машинное обучение</h3>
          <p className="text-slate-600">Мощные алгоритмы бекенда для выявления неочевидных трендов.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-4">⚡️</div>
          <h3 className="text-xl font-bold mb-2">Быстрая аналитика</h3>
          <p className="text-slate-600">Мгновенный отклик и удобный интерфейс для анализа графиков.</p>
        </div>
      </div>
    </div>
  );
}