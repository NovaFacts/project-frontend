import api from './api';
import type { Payment, CreatePaymentRequest } from '../types/payment';

export async function getPayments(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/api/payments');
    return response.data;
}

export async function getPayment(id: number): Promise<Payment> {
    const response = await api.get<Payment>(`/api/payments/${id}`);
    return response.data;
}

export async function getPaymentByInvoice(invoiceId: number): Promise<Payment> {
    const response = await api.get<Payment>(`/api/payments/by-invoice/${invoiceId}`);
    return response.data;
}

export async function createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await api.post<Payment>('/api/payments', data);
    return response.data;
}

export async function deletePayment(id: number): Promise<void> {
    await api.delete(`/api/payments/${id}`);
}
