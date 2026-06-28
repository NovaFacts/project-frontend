export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
    id: number;
    guestId: number;
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    status: ReservationStatus;
    createdAt: string;
}

export interface CreateReservationRequest {
    guestId: number;
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
}

export interface UpdateReservationRequest {
    guestId: number;
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    status: ReservationStatus;
}
