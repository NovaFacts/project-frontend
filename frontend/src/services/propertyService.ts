import api from './api';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from '../types/property';

export async function getProperties(): Promise<Property[]> {
    const response = await api.get<Property[]>('/api/properties');
    return response.data;
}

export async function getProperty(id: number): Promise<Property> {
    const response = await api.get<Property>(`/api/properties/${id}`);
    return response.data;
}

export async function createProperty(data: CreatePropertyRequest): Promise<Property> {
    const response = await api.post<Property>('/api/properties', data);
    return response.data;
}

export async function updateProperty(id: number, data: UpdatePropertyRequest): Promise<Property> {
    const response = await api.put<Property>(`/api/properties/${id}`, data);
    return response.data;
}

export async function deleteProperty(id: number): Promise<void> {
    await api.delete(`/api/properties/${id}`);
}
