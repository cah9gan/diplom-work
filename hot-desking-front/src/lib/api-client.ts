import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Додаємо перехоплювач: він спрацьовує ПЕРЕД кожним запитом
apiClient.interceptors.request.use((config) => {
  // Перевіряємо, чи ми в браузері, і дістаємо токен
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    // Якщо токен є, чіпляємо його в заголовки
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
