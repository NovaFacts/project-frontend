<template>
  <main class="page-main">
    <div class="page-header">
      <h1>Devoluciones</h1>
      <button class="btn btn--primary" @click="openModal">Nueva devolución</button>
    </div>

    <div v-if="isLoading" class="state-box"><span class="spinner" /></div>
    <p v-else-if="error" class="page-error">{{ error }}</p>

    <table v-else-if="devoluciones.length" class="data-table">
      <thead>
        <tr>
          <th>Reserva</th>
          <th>Anticipo</th>
          <th>Monto</th>
          <th>Método</th>
          <th>Estado</th>
          <th>Generada</th>
          <th>Procesada</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in devoluciones" :key="d.id">
          <td>#{{ d.reservaId }}</td>
          <td>#{{ d.anticipoId }}</td>
          <td>{{ fmt(d.monto) }}</td>
          <td>{{ d.metodo ?? '—' }}</td>
          <td><span :class="['badge', badgeClass(d.estado)]">{{ d.estado }}</span></td>
          <td>{{ d.generadaEn?.slice(0, 10) }}</td>
          <td>{{ d.procesadaEn?.slice(0, 10) ?? '—' }}</td>
          <td class="actions">
            <button
              v-if="d.estado === 'pendiente'"
              class="btn btn--sm btn--success"
              @click="procesar(d.id)"
            >Procesar</button>
            <button
              v-if="d.estado === 'pendiente'"
              class="btn btn--sm btn--ghost"
              @click="rechazar(d.id)"
            >Rechazar</button>
            <button
              v-if="d.estado === 'pendiente'"
              class="btn btn--sm btn--danger"
              @click="confirmarEliminar(d)"
            >Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="state-box">No hay devoluciones registradas.</p>

    <!-- Modal crear devolución -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Nueva devolución</h2>
        <form @submit.prevent="submitForm">

          <label>Reserva</label>
          <select v-model.number="form.reservaId" required @change="onReservaChange">
            <option disabled value="">— Seleccione reserva —</option>
            <option v-for="r in reservas" :key="r.id" :value="r.id">
              #{{ r.id }} — {{ r.clienteNombre }}
            </option>
          </select>

          <label>Anticipo</label>
          <select v-model.number="form.anticipoId" required :disabled="!form.reservaId || anticiposDeReserva.length === 0">
            <option disabled value="">— Seleccione anticipo —</option>
            <option v-for="a in anticiposDeReserva" :key="a.id" :value="a.id">
              #{{ a.id }} — {{ fmt(a.monto) }} ({{ a.estado }})
            </option>
          </select>
          <small v-if="form.reservaId && anticiposDeReserva.length === 0">
            No hay anticipos para esta reserva.
          </small>

          <label>Monto a devolver</label>
          <input v-model.number="form.monto" type="number" min="0.01" step="0.01" required />

          <label>Método <span class="opt">(opcional)</span></label>
          <input v-model="form.metodo" type="text" maxlength="80" placeholder="transferencia, efectivo…" />

          <p v-if="formError" class="page-error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando…' : 'Registrar devolución' }}
            </button>
            <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmar eliminación -->
    <div v-if="devAEliminar" class="modal-overlay" @click.self="devAEliminar = null">
      <div class="modal modal--sm">
        <h2>¿Eliminar devolución?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn btn--danger" :disabled="isSubmitting" @click="eliminar">
            {{ isSubmitting ? 'Eliminando…' : 'Eliminar' }}
          </button>
          <button class="btn btn--ghost" @click="devAEliminar = null">Cancelar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDevoluciones, createDevolucion, procesarDevolucion, rechazarDevolucion, deleteDevolucion } from '../services/devolucionService'
import { getAnticiposByReserva } from '../services/anticipoService'
import { getReservations } from '../services/reservationService'
import type { Devolucion, CreateDevolucionRequest } from '../types/devolucion'
import type { Anticipo } from '../types/anticipo'
import type { Reservation } from '../types/reservation'

const devoluciones = ref<Devolucion[]>([])
const reservas = ref<Reservation[]>([])
const anticiposDeReserva = ref<Anticipo[]>([])
const isLoading = ref(false)
const error = ref('')
const showModal = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const devAEliminar = ref<Devolucion | null>(null)

const emptyForm = () => ({
  reservaId: '' as number | '',
  anticipoId: '' as number | '',
  monto: 0,
  metodo: ''
})
const form = ref(emptyForm())

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(n ?? 0)
}

function badgeClass(estado: string) {
  if (estado === 'procesada') return 'badge--success'
  if (estado === 'rechazada') return 'badge--danger'
  return 'badge--warning'
}

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const [ds, rs] = await Promise.all([getDevoluciones(), getReservations()])
    devoluciones.value = ds
    reservas.value = rs
  } catch {
    error.value = 'Error al cargar devoluciones.'
  } finally {
    isLoading.value = false
  }
}

async function onReservaChange() {
  form.value.anticipoId = ''
  anticiposDeReserva.value = []
  const rid = form.value.reservaId
  if (!rid) return
  try {
    anticiposDeReserva.value = await getAnticiposByReserva(Number(rid))
  } catch {
    anticiposDeReserva.value = []
  }
}

function openModal() {
  form.value = emptyForm()
  anticiposDeReserva.value = []
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitForm() {
  if (!form.value.reservaId) { formError.value = 'Seleccione una reserva.'; return }
  if (!form.value.anticipoId) { formError.value = 'Seleccione un anticipo.'; return }
  isSubmitting.value = true
  formError.value = ''
  try {
    const payload: CreateDevolucionRequest = {
      reservaId: Number(form.value.reservaId),
      anticipoId: Number(form.value.anticipoId),
      monto: form.value.monto,
      metodo: form.value.metodo || undefined
    }
    const created = await createDevolucion(payload)
    devoluciones.value.unshift(created)
    closeModal()
  } catch (e: any) {
    formError.value = e?.response?.data?.error ?? 'Error al registrar la devolución.'
  } finally {
    isSubmitting.value = false
  }
}

async function procesar(id: number) {
  try {
    const updated = await procesarDevolucion(id)
    const idx = devoluciones.value.findIndex(d => d.id === id)
    if (idx !== -1) devoluciones.value[idx] = updated
  } catch (e: any) {
    alert(e?.response?.data?.error ?? 'Error al procesar la devolución.')
  }
}

async function rechazar(id: number) {
  try {
    const updated = await rechazarDevolucion(id)
    const idx = devoluciones.value.findIndex(d => d.id === id)
    if (idx !== -1) devoluciones.value[idx] = updated
  } catch (e: any) {
    alert(e?.response?.data?.error ?? 'Error al rechazar la devolución.')
  }
}

function confirmarEliminar(d: Devolucion) {
  devAEliminar.value = d
}

async function eliminar() {
  if (!devAEliminar.value) return
  isSubmitting.value = true
  try {
    await deleteDevolucion(devAEliminar.value.id)
    devoluciones.value = devoluciones.value.filter(d => d.id !== devAEliminar.value?.id)
    devAEliminar.value = null
  } catch (e: any) {
    alert(e?.response?.data?.error ?? 'Error al eliminar la devolución.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(load)
</script>
