import api from './api';
import type { Temporada, TemporadaRequest } from '../types/temporada';

export async function getTemporadas(): Promise<Temporada[]> {
    const response = await api.get<Temporada[]>('/api/temporadas');
    return response.data;
}

export async function createTemporada(data: TemporadaRequest): Promise<Temporada> {
    const response = await api.post<Temporada>('/api/temporadas', data);
    return response.data;
}

export async function updateTemporada(id: number, data: TemporadaRequest): Promise<Temporada> {
    const response = await api.put<Temporada>(`/api/temporadas/${id}`, data);
    return response.data;
}

export async function deleteTemporada(id: number): Promise<void> {
    await api.delete(`/api/temporadas/${id}`);
}
