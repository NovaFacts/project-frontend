export interface Anticipo {
    id: number;
    reservaId: number;
    usuarioId: number;
    usuarioNombre: string;
    monto: number;
    fechaPago: string;
    metodoPago: string | null;
    estado: string;
    registradoEn: string;
}

export interface CreateAnticipoRequest {
    reservaId: number;
    monto: number;
    fechaPago: string;
    metodoPago?: string;
}
