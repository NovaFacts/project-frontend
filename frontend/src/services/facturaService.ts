import api from './api'
import type { Factura, CreateFacturaRequest } from '../types/factura'

export const getFacturas = (page = 0, size = 50): Promise<Factura[]> =>
  api.get(`/api/facturas?page=${page}&size=${size}`).then(r => r.data.content)

export const getFactura = (id: number): Promise<Factura> =>
  api.get(`/api/facturas/${id}`).then(r => r.data)

export const getFacturaByReserva = (reservaId: number): Promise<Factura> =>
  api.get(`/api/facturas/by-reserva/${reservaId}`).then(r => r.data)

export const createFactura = (data: CreateFacturaRequest): Promise<Factura> =>
  api.post('/api/facturas', data).then(r => r.data)

export const emitirFactura = (id: number): Promise<Factura> =>
  api.put(`/api/facturas/${id}/emitir`).then(r => r.data)

export const anularFactura = (id: number): Promise<Factura> =>
  api.put(`/api/facturas/${id}/anular`).then(r => r.data)

export const deleteFactura = (id: number): Promise<void> =>
  api.delete(`/api/facturas/${id}`).then(r => r.data)
