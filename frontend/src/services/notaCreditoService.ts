import api from './api'
import type { NotaCredito, CreateNotaCreditoRequest } from '../types/notaCredito'

export const getNotasCredito = (): Promise<NotaCredito[]> =>
  api.get('/api/notas-credito?page=0&size=50').then(r => r.data.content)

export const getNotaCredito = (id: number): Promise<NotaCredito> =>
  api.get(`/api/notas-credito/${id}`).then(r => r.data)

export const getNotasByFactura = (facturaId: number): Promise<NotaCredito[]> =>
  api.get(`/api/notas-credito/by-factura/${facturaId}`).then(r => r.data)

export const createNotaCredito = (data: CreateNotaCreditoRequest): Promise<NotaCredito> =>
  api.post('/api/notas-credito', data).then(r => r.data)

export const deleteNotaCredito = (id: number): Promise<void> =>
  api.delete(`/api/notas-credito/${id}`).then(r => r.data)
