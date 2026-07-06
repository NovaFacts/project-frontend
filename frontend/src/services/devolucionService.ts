import api from './api'
import type { Devolucion, CreateDevolucionRequest } from '../types/devolucion'

export const getDevoluciones = (): Promise<Devolucion[]> =>
  api.get('/api/devoluciones?page=0&size=50').then(r => r.data.content)

export const getDevolucion = (id: number): Promise<Devolucion> =>
  api.get(`/api/devoluciones/${id}`).then(r => r.data)

export const getDevolucionesByReserva = (reservaId: number): Promise<Devolucion[]> =>
  api.get(`/api/devoluciones/by-reserva/${reservaId}`).then(r => r.data)

export const createDevolucion = (data: CreateDevolucionRequest): Promise<Devolucion> =>
  api.post('/api/devoluciones', data).then(r => r.data)

export const procesarDevolucion = (id: number): Promise<Devolucion> =>
  api.put(`/api/devoluciones/${id}/procesar`).then(r => r.data)

export const rechazarDevolucion = (id: number): Promise<Devolucion> =>
  api.put(`/api/devoluciones/${id}/rechazar`).then(r => r.data)

export const deleteDevolucion = (id: number): Promise<void> =>
  api.delete(`/api/devoluciones/${id}`).then(r => r.data)
