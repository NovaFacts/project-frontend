export interface Property {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    pricePerNight: number;
    createdAt: string;
}

export interface CreatePropertyRequest {
    name: string;
    address: string;
    city: string;
    capacity: number;
    pricePerNight: number;
}

export type UpdatePropertyRequest = CreatePropertyRequest;
