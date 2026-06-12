"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();

  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Помилка авторизації");
      }

      if (data.requires2FA) {
        setMessage(data.message);
        setStep("code");
      } else {
        if (data.token) {
          localStorage.setItem("token", data.token);
          router.push("/market");
        }
      }
    } catch (err) {
      // 👇 Безпечна перевірка типу помилки замість :any
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Сталася невідома помилка");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Невірний код");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/market");
      }
    } catch (err) {
      // 👇 Безпечна перевірка типу помилки замість :any
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Сталася невідома помилка");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-black/50 border border-zinc-800">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          {step === "credentials" ? "З поверненням!" : "Перевірка безпеки"}
        </h1>
        <p className="text-zinc-400">
          {step === "credentials"
            ? "Увійдіть до свого акаунту для доступу до торгів"
            : "Введіть 6-значний код, який ми відправили на вашу пошту"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center font-medium">
          {error}
        </div>
      )}

      {message && step === "code" && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm text-center font-medium">
          ✅ {message}
        </div>
      )}

      {step === "credentials" && (
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:hover:shadow-lg mt-4"
          >
            {isLoading ? "Завантаження..." : "Увійти"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 text-center">
              Код підтвердження
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-4 rounded-xl border border-zinc-700 bg-zinc-950/50 text-white focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-center text-3xl font-mono tracking-[0.5em] placeholder:text-zinc-700"
              placeholder="------"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-linear-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 mt-4"
          >
            {isLoading ? "Перевірка..." : "Підтвердити"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setCode("");
              setError(null);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-300 text-center mt-2 transition-colors font-medium"
          >
            &larr; Повернутися назад
          </button>
        </form>
      )}

      {step === "credentials" && (
        <div className="mt-8 text-center text-sm text-zinc-400">
          Ще немає акаунту?{" "}
          <Link href="/register" className="text-orange-400 font-bold hover:text-orange-300 transition-colors">
            Зареєструватися
          </Link>
        </div>
      )}
    </div>
  );
}