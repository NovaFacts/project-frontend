import axios from 'axios';
import type { LoginCredentials, AuthResult } from '../types/auth';

const TOKEN_KEY = 'auth_token';

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function authenticateUser({ email, password, shouldRememberUser }: LoginCredentials): Promise<AuthResult> {
    if (!email.includes('@')) {
        return { status: 'invalid_credentials', message: 'El formato del correo es inválido.' };
    }

    try {
        const response = await axios.post('/api/auth/login', { email, password });
        const token: string = response.data.token;

        localStorage.setItem(TOKEN_KEY, token);

        if (shouldRememberUser) {
            localStorage.setItem('user_remembered', email);
        }

        return {
            status: 'success',
            token,
            user: { email }
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { status: 'server_error', errorCode: error.response.status };
        }

        return { status: 'server_error', errorCode: 500 };
    }
}

export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user_remembered');
}
