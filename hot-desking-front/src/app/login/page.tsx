import { LoginForm } from "./LoginForm";
import Link from "next/link"; // Встроенный компонент Next.js для ссылок

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Вход в систему</h1>
      
      <LoginForm />

      {/* Ссылка на регистрацию для удобства */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}