export interface NotaCredito {
  id: number
  facturaId: number
  numeroFactura: string
  usuarioId: number
  usuarioNombre: string
  numeroNota: string
  monto: number
  motivo: string | null
  emitidaEn: string
}

export interface CreateNotaCreditoRequest {
  facturaId: number
  monto: number
  motivo?: string
}
