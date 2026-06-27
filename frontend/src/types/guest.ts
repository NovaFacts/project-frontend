export interface Guest {
    id: number;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    email: string | null;
    phone: string | null;
    createdAt: string;
}

export interface CreateGuestRequest {
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    email: string | null;
    phone: string | null;
}

export interface UpdateGuestRequest {
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    email: string | null;
    phone: string | null;
}
