import api from './api';
import type { Penalidad, CreatePenalidadRequest } from '../types/penalidad';

export async function getPenalidades(): Promise<Penalidad[]> {
    const response = await api.get('/api/penalidades?page=0&size=50');
    return response.data.content;
}

export async function getPenalidadesByReserva(reservaId: number): Promise<Penalidad[]> {
    const response = await api.get<Penalidad[]>(`/api/penalidades/by-reserva/${reservaId}`);
    return response.data;
}

export async function createPenalidad(data: CreatePenalidadRequest): Promise<Penalidad> {
    const response = await api.post<Penalidad>('/api/penalidades', data);
    return response.data;
}

export async function deletePenalidad(id: number): Promise<void> {
    await api.delete(`/api/penalidades/${id}`);
}
