import api from './api';
import type { Reservation, CreateReservationRequest, UpdateReservationRequest } from '../types/reservation';

export async function getReservations(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/api/reservations');
    return response.data;
}

export async function getReservation(id: number): Promise<Reservation> {
    const response = await api.get<Reservation>(`/api/reservations/${id}`);
    return response.data;
}

export async function createReservation(data: CreateReservationRequest): Promise<Reservation> {
    const response = await api.post<Reservation>('/api/reservations', data);
    return response.data;
}

export async function updateReservation(id: number, data: UpdateReservationRequest): Promise<Reservation> {
    const response = await api.put<Reservation>(`/api/reservations/${id}`, data);
    return response.data;
}

export async function deleteReservation(id: number): Promise<void> {
    await api.delete(`/api/reservations/${id}`);
}
