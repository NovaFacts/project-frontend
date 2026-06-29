export type FacturaEstado = 'PENDING' | 'PAID' | 'CANCELLED'

export interface Factura {
  id: number
  reservaId: number
  usuarioId: number
  usuarioNombre: string
  numeroFactura: string
  subtotal: number
  descuentoAnticipo: number
  recargoPenalidad: number
  impuestos: number
  total: number
  estado: FacturaEstado
  urlDocumento: string | null
  emitidaEn: string
}

export interface CreateFacturaRequest {
  reservaId: number
  subtotal: number
  descuentoAnticipo?: number
  recargoPenalidad?: number
  impuestos?: number
  urlDocumento?: string
}
