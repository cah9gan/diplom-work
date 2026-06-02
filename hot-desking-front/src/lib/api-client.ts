import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Добавляем перехватчик: он срабатывает ПЕРЕД каждым запросом
apiClient.interceptors.request.use((config) => {
  // Проверяем, что мы в браузере, и достаем токен
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    // Если токен есть, цепляем его в заголовки
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
