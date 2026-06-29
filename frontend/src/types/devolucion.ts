export type DevolucionEstado = 'pendiente' | 'procesada' | 'rechazada'

export interface Devolucion {
  id: number
  reservaId: number
  anticipoId: number
  usuarioId: number
  usuarioNombre: string
  monto: number
  metodo: string | null
  estado: DevolucionEstado
  generadaEn: string
  procesadaEn: string | null
}

export interface CreateDevolucionRequest {
  reservaId: number
  anticipoId: number
  monto: number
  metodo?: string
}
