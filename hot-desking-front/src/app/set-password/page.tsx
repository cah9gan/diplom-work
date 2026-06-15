import { Suspense } from "react";
import { SetPasswordForm } from "./SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Створення пароля</h1>
      
      {/* Suspense нужен Next.js для правильной работы с параметрами URL */}
      <Suspense fallback={<div className="text-center">Завантаження даних...</div>}>
        <SetPasswordForm />
      </Suspense>
      
    </div>
  );
}