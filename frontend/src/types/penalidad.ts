export interface Penalidad {
    id: number;
    reservaId: number;
    usuarioId: number;
    usuarioNombre: string;
    montoSegunPolitica: number;
    montoAprobado: number;
    montoCondonado: number;
    fechaCancelacion: string;
    motivo: string | null;
    calculadoEn: string;
}

export interface CreatePenalidadRequest {
    reservaId: number;
    montoSegunPolitica: number;
    montoAprobado: number;
    montoCondonado?: number;
    fechaCancelacion: string;
    motivo?: string;
}
