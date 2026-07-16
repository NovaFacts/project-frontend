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

// A 401 means the stored token is missing/expired/invalid — Spring Security rejects it
// before any request-specific handling runs, so every view would otherwise show the same
// generic "session" error with no way to recover. Handling it here once, centrally, clears
// the stale session and sends the user back to log in again. The login request itself is
// excluded so a bad-credentials response doesn't bounce the user right back to the page
// they're already on.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/api/auth/login');
        if (isAxiosError(error) && error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(ROL_KEY);
            localStorage.removeItem(NOMBRE_KEY);
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
