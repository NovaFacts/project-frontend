import api from './api';
import type { Anticipo, CreateAnticipoRequest } from '../types/anticipo';

export async function getAnticipos(): Promise<Anticipo[]> {
    const response = await api.get<Anticipo[]>('/api/anticipos');
    return response.data;
}

export async function getAnticiposByReserva(reservaId: number): Promise<Anticipo[]> {
    const response = await api.get<Anticipo[]>(`/api/anticipos/by-reserva/${reservaId}`);
    return response.data;
}

export async function createAnticipo(data: CreateAnticipoRequest): Promise<Anticipo> {
    const response = await api.post<Anticipo>('/api/anticipos', data);
    return response.data;
}

export async function deleteAnticipo(id: number): Promise<void> {
    await api.delete(`/api/anticipos/${id}`);
}
