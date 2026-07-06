import api from './api';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from '../types/property';

export async function getProperties(): Promise<Property[]> {
    const response = await api.get('/api/propiedades?page=0&size=50');
    return response.data.content;
}

export async function getProperty(id: number): Promise<Property> {
    const response = await api.get<Property>(`/api/propiedades/${id}`);
    return response.data;
}

export async function createProperty(data: CreatePropertyRequest): Promise<Property> {
    const response = await api.post<Property>('/api/propiedades', data);
    return response.data;
}

export async function updateProperty(id: number, data: UpdatePropertyRequest): Promise<Property> {
    const response = await api.put<Property>(`/api/propiedades/${id}`, data);
    return response.data;
}

export async function deleteProperty(id: number): Promise<void> {
    await api.delete(`/api/propiedades/${id}`);
}
