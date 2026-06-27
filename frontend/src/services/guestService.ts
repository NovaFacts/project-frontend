import api from './api';
import type { Guest, CreateGuestRequest, UpdateGuestRequest } from '../types/guest';

export async function getGuests(): Promise<Guest[]> {
    const response = await api.get<Guest[]>('/api/guests');
    return response.data;
}

export async function getGuest(id: number): Promise<Guest> {
    const response = await api.get<Guest>(`/api/guests/${id}`);
    return response.data;
}

export async function createGuest(data: CreateGuestRequest): Promise<Guest> {
    const response = await api.post<Guest>('/api/guests', data);
    return response.data;
}

export async function updateGuest(id: number, data: UpdateGuestRequest): Promise<Guest> {
    const response = await api.put<Guest>(`/api/guests/${id}`, data);
    return response.data;
}

export async function deleteGuest(id: number): Promise<void> {
    await api.delete(`/api/guests/${id}`);
}
