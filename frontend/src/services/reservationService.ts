import api from './api';
import type { Reservation, CreateReservationRequest, UpdateReservationRequest } from '../types/reservation';

export async function getReservations(): Promise<Reservation[]> {
    const response = await api.get('/api/reservas?page=0&size=50');
    return response.data.content;
}

export async function getReservation(id: number): Promise<Reservation> {
    const response = await api.get<Reservation>(`/api/reservas/${id}`);
    return response.data;
}

export async function createReservation(data: CreateReservationRequest): Promise<Reservation> {
    const response = await api.post<Reservation>('/api/reservas', data);
    return response.data;
}

export async function updateReservation(id: number, data: UpdateReservationRequest): Promise<Reservation> {
    const response = await api.put<Reservation>(`/api/reservas/${id}`, data);
    return response.data;
}

export async function deleteReservation(id: number): Promise<void> {
    await api.delete(`/api/reservas/${id}`);
}
