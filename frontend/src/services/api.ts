import axios, { isAxiosError } from 'axios';

export { isAxiosError };
export const TOKEN_KEY = 'auth_token';
export const ROL_KEY = 'user_rol';
export const NOMBRE_KEY = 'user_nombre';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
