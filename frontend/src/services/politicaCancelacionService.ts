import api from './api';
import type { PoliticaCancelacion, PoliticaCancelacionRequest } from '../types/politicaCancelacion';

export async function getPoliticas(): Promise<PoliticaCancelacion[]> {
    const response = await api.get<PoliticaCancelacion[]>('/api/politicas');
    return response.data;
}

export async function getPoliticasByPropiedad(propiedadId: number): Promise<PoliticaCancelacion[]> {
    const response = await api.get<PoliticaCancelacion[]>(`/api/politicas/propiedad/${propiedadId}`);
    return response.data;
}

export async function createPolitica(data: PoliticaCancelacionRequest): Promise<PoliticaCancelacion> {
    const response = await api.post<PoliticaCancelacion>('/api/politicas', data);
    return response.data;
}

export async function updatePolitica(id: number, data: PoliticaCancelacionRequest): Promise<PoliticaCancelacion> {
    const response = await api.put<PoliticaCancelacion>(`/api/politicas/${id}`, data);
    return response.data;
}

export async function deletePolitica(id: number): Promise<void> {
    await api.delete(`/api/politicas/${id}`);
}
