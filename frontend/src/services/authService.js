import axios from 'axios';

// Instancia configurada para reutilizar la URL base y cabeceras
const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const authService = {
    async login(correo, password) {
        try {
            // Petición POST. Nota la barra final (/login/) requerida por Django
            const response = await apiClient.post('/login/', {
                correo,
                password
            });
            // Si el status es 2xx, Axios retorna la data aquí
            return response.data;
        } catch (error) {
            // Si el status es 4xx o 5xx, Axios lanza un error y cae aquí
            if (error.response) {
                // El servidor respondió (ej. 401 Unauthorized o 400 Bad Request)
                return error.response.data;
            } else {
                // Error de red (el servidor backend está apagado o no hay conexión)
                return { 
                    success: false, 
                    message: "Error de red: No se pudo conectar con el servidor." 
                };
            }
        }
    }
};
