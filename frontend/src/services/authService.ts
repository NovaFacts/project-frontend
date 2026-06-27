import axios from 'axios';
import api, { TOKEN_KEY } from './api';
import type { LoginCredentials, AuthResult } from '../types/auth';

export async function authenticateUser({ email, password, shouldRememberUser }: LoginCredentials): Promise<AuthResult> {
    if (!email.includes('@')) {
        return { status: 'invalid_credentials', message: 'El formato del correo es inválido.' };
    }

    try {
        const response = await api.post('/api/auth/login', { email, password });
        const token: string = response.data.token;

        if (!token) {
            return { status: 'server_error', errorCode: 500 };
        }

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
