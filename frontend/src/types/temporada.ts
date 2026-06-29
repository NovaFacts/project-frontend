export interface Temporada {
    id: number;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
}

export interface TemporadaRequest {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
}
