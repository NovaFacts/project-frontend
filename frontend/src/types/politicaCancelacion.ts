export interface PoliticaCancelacion {
    id: number;
    propiedadId: number;
    propiedadNombre: string;
    nombre: string;
    descripcion: string | null;
    porcentajeReembolso: number;
    diasAviso: number;
}

export interface PoliticaCancelacionRequest {
    propiedadId: number;
    nombre: string;
    descripcion?: string;
    porcentajeReembolso: number;
    diasAviso: number;
}
