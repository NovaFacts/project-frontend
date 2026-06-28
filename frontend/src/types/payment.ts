export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface Payment {
    id: number;
    invoiceId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    reference: string | null;
    paidAt: string;
    createdAt: string;
}

export interface CreatePaymentRequest {
    invoiceId: number;
    paymentMethod: PaymentMethod;
    reference?: string;
}
