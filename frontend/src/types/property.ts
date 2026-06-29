export interface Property {
    id: number;
    name: string;
    address: string | null;
    descripcion: string | null;
    activa: boolean;
}

export interface CreatePropertyRequest {
    name: string;
    address?: string;
    descripcion?: string;
}

export interface UpdatePropertyRequest {
    name: string;
    address?: string;
    descripcion?: string;
    activa: boolean;
}
