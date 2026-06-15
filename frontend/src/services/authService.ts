import axios from 'axios';
import type { LoginCredentials, AuthResult } from '../types/auth';

export async function authenticateUser({ email, password, shouldRememberUser }: LoginCredentials): Promise<AuthResult> {
    if (!email.includes('@')) {
        return { status: 'invalid_credentials', message: 'El formato del correo es inválido.' };
    }

    try {
        const response = await axios.post('/api/auth/login', { email, password });

        if (shouldRememberUser) {
            localStorage.setItem('user_remembered', email);
        }

        return {
            status: 'success',
            token: response.data.token,
            user: { email }
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { status: 'server_error', errorCode: error.response.status };
        }

        return { status: 'server_error', errorCode: 500 };
    }
}