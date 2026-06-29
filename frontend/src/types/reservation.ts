export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
    id: number;
    propertyId: number;
    canalId: number;
    canalNombre: string;
    temporadaId: number;
    temporadaNombre: string;
    politicaCancelacionId: number;
    politicaCancelacionNombre: string;
    usuarioCreadorId: number;
    usuarioCreadorNombre: string;
    clienteNombre: string;
    clienteEmail: string | null;
    clienteTelefono: string | null;
    montoTotal: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    status: ReservationStatus;
    createdAt: string;
}

export interface CreateReservationRequest {
    propertyId: number;
    canalId: number;
    temporadaId: number;
    politicaCancelacionId: number;
    clienteNombre: string;
    clienteEmail?: string;
    clienteTelefono?: string;
    montoTotal: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
}

export interface UpdateReservationRequest {
    propertyId: number;
    canalId: number;
    temporadaId: number;
    politicaCancelacionId: number;
    clienteNombre: string;
    clienteEmail?: string;
    clienteTelefono?: string;
    montoTotal: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    status: ReservationStatus;
}
