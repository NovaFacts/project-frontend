export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Invoice {
    id: number;
    reservationId: number;
    subtotal: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    createdAt: string;
}

export interface CreateInvoiceRequest {
    reservationId: number;
}
