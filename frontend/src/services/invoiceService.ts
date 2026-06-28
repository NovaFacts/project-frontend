import api from './api';
import type { Invoice, CreateInvoiceRequest } from '../types/invoice';

export async function getInvoices(): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/api/invoices');
    return response.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
    const response = await api.get<Invoice>(`/api/invoices/${id}`);
    return response.data;
}

export async function getInvoiceByReservation(reservationId: number): Promise<Invoice> {
    const response = await api.get<Invoice>(`/api/invoices/by-reservation/${reservationId}`);
    return response.data;
}

export async function createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await api.post<Invoice>('/api/invoices', data);
    return response.data;
}

export async function cancelInvoice(id: number): Promise<Invoice> {
    const response = await api.put<Invoice>(`/api/invoices/${id}/cancel`);
    return response.data;
}

export async function deleteInvoice(id: number): Promise<void> {
    await api.delete(`/api/invoices/${id}`);
}
