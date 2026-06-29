import api from './api';

export interface UserResponse {
    id: number;
    email: string;
    nombre: string;
    rol: { id: number; nombre: string; descripcion: string | null };
}

export interface CreateUserRequest {
    nombre: string;
    email: string;
    password: string;
    rolId: number;
}

export async function getUsuarios(): Promise<UserResponse[]> {
    const response = await api.get<UserResponse[]>('/api/usuarios');
    return response.data;
}

export async function createUsuario(data: CreateUserRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/api/usuarios', data);
    return response.data;
}
