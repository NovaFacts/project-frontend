import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8082/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const authService = {
    async login(correo, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                username: correo,
                password: password
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data;
            } else {
                return {
                    success: false,
                    message: "Error de red: No se pudo conectar con el servidor."
                };
            }
        }
    }
};
