<template>
  <main class="page-main">
    <div class="page-header">
      <h1>Facturas</h1>
      <button class="btn btn--primary" @click="openModal">Nueva factura</button>
    </div>

    <div v-if="isLoading" class="state-box"><span class="spinner" /></div>
    <p v-else-if="error" class="page-error">{{ error }}</p>

    <table v-else-if="facturas.length" class="data-table">
      <thead>
        <tr>
          <th>N.º Factura</th>
          <th>Reserva</th>
          <th>Subtotal</th>
          <th>Desc. Anticipo</th>
          <th>Recargo Pen.</th>
          <th>Impuestos</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in facturas" :key="f.id">
          <td>{{ f.numeroFactura }}</td>
          <td>#{{ f.reservaId }}</td>
          <td>{{ fmt(f.subtotal) }}</td>
          <td>{{ fmt(f.descuentoAnticipo) }}</td>
          <td>{{ fmt(f.recargoPenalidad) }}</td>
          <td>{{ fmt(f.impuestos) }}</td>
          <td>{{ fmt(f.total) }}</td>
          <td><span :class="['badge', badgeClass(f.estado)]">{{ estadoLabel(f.estado) }}</span></td>
          <td>{{ f.emitidaEn?.slice(0, 10) }}</td>
          <td class="actions">
            <button
              v-if="f.estado === 'PENDING'"
              class="btn btn--sm btn--success"
              @click="emitir(f.id)"
            >Emitir</button>
            <button
              v-if="f.estado === 'PENDING'"
              class="btn btn--sm btn--ghost"
              @click="anular(f.id)"
            >Anular</button>
            <button
              v-if="f.estado !== 'PAID'"
              class="btn btn--sm btn--danger"
              @click="confirmarEliminar(f)"
            >Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="state-box">No hay facturas registradas.</p>

    <!-- Modal crear factura -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Nueva factura</h2>
        <form @submit.prevent="submitForm">

          <label>Reserva</label>
          <select v-model.number="form.reservaId" required @change="onReservaChange">
            <option disabled value="">— Seleccione reserva —</option>
            <option v-for="r in reservas" :key="r.id" :value="r.id">
              #{{ r.id }} — {{ r.clienteNombre }}
            </option>
          </select>

          <template v-if="form.reservaId">
            <div class="auto-row">
              <div>
                <label>Descuento anticipo (auto)</label>
                <input type="number" :value="form.descuentoAnticipo" readonly class="input-readonly" />
              </div>
              <div>
                <label>Recargo penalidad (auto)</label>
                <input type="number" :value="form.recargoPenalidad" readonly class="input-readonly" />
              </div>
            </div>
          </template>

          <label>Subtotal</label>
          <input v-model.number="form.subtotal" type="number" min="0.01" step="0.01" required @input="recalcular" />

          <label>Impuestos (sugerido: 19%)</label>
          <input v-model.number="form.impuestos" type="number" min="0" step="0.01" />

          <div class="total-preview">
            <strong>Total calculado:</strong> {{ fmt(calculatedTotal) }}
            <small>(subtotal − desc. anticipo + recargo pen. + impuestos)</small>
          </div>

          <label>URL documento <span class="opt">(opcional)</span></label>
          <input v-model="form.urlDocumento" type="url" maxlength="500" />

          <p v-if="formError" class="page-error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando…' : 'Crear factura' }}
            </button>
            <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmar eliminación -->
    <div v-if="facturaAEliminar" class="modal-overlay" @click.self="facturaAEliminar = null">
      <div class="modal modal--sm">
        <h2>¿Eliminar factura?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn btn--danger" :disabled="isSubmitting" @click="eliminar">
            {{ isSubmitting ? 'Eliminando…' : 'Eliminar' }}
          </button>
          <button class="btn btn--ghost" @click="facturaAEliminar = null">Cancelar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getFacturas, createFactura, emitirFactura, anularFactura, deleteFactura } from '../services/facturaService'
import { getAnticiposByReserva } from '../services/anticipoService'
import { getPenalidadesByReserva } from '../services/penalidadService'
import { getReservations } from '../services/reservationService'
import type { Factura, CreateFacturaRequest } from '../types/factura'
import type { Reservation } from '../types/reservation'

const facturas = ref<Factura[]>([])
const reservas = ref<Reservation[]>([])
const isLoading = ref(false)
const error = ref('')
const showModal = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const facturaAEliminar = ref<Factura | null>(null)

const emptyForm = () => ({
  reservaId: '' as number | '',
  subtotal: 0,
  descuentoAnticipo: 0,
  recargoPenalidad: 0,
  impuestos: 0,
  urlDocumento: ''
})
const form = ref(emptyForm())

const calculatedTotal = computed(() =>
  (form.value.subtotal || 0)
  - (form.value.descuentoAnticipo || 0)
  + (form.value.recargoPenalidad || 0)
  + (form.value.impuestos || 0)
)

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(n ?? 0)
}

function badgeClass(estado: string) {
  if (estado === 'PAID') return 'badge--success'
  if (estado === 'CANCELLED') return 'badge--danger'
  return 'badge--warning'
}

function estadoLabel(estado: string) {
  if (estado === 'PAID') return 'Emitida'
  if (estado === 'CANCELLED') return 'Anulada'
  return 'Pendiente'
}

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const [fs, rs] = await Promise.all([getFacturas(), getReservations()])
    facturas.value = fs
    reservas.value = rs
  } catch {
    error.value = 'Error al cargar facturas.'
  } finally {
    isLoading.value = false
  }
}

async function onReservaChange() {
  const rid = form.value.reservaId
  if (!rid) return
  try {
    const [anticipos, penalidades] = await Promise.all([
      getAnticiposByReserva(Number(rid)),
      getPenalidadesByReserva(Number(rid))
    ])
    form.value.descuentoAnticipo = anticipos.reduce((s, a) => s + (a.monto || 0), 0)
    form.value.recargoPenalidad = penalidades.reduce((s, p) => s + (p.montoAprobado || 0), 0)
  } catch {
    form.value.descuentoAnticipo = 0
    form.value.recargoPenalidad = 0
  }
}

function recalcular() {
  form.value.impuestos = Math.round(form.value.subtotal * 0.19 * 100) / 100
}

function openModal() {
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitForm() {
  if (!form.value.reservaId) { formError.value = 'Seleccione una reserva.'; return }
  isSubmitting.value = true
  formError.value = ''
  try {
    const payload: CreateFacturaRequest = {
      reservaId: Number(form.value.reservaId),
      subtotal: form.value.subtotal,
      descuentoAnticipo: form.value.descuentoAnticipo,
      recargoPenalidad: form.value.recargoPenalidad,
      impuestos: form.value.impuestos,
      urlDocumento: form.value.urlDocumento || undefined
    }
    const created = await createFactura(payload)
    facturas.value.unshift(created)
    closeModal()
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error al crear la factura.'
  } finally {
    isSubmitting.value = false
  }
}

async function emitir(id: number) {
  try {
    const updated = await emitirFactura(id)
    const idx = facturas.value.findIndex(f => f.id === id)
    if (idx !== -1) facturas.value[idx] = updated
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Error al emitir la factura.')
  }
}

async function anular(id: number) {
  try {
    const updated = await anularFactura(id)
    const idx = facturas.value.findIndex(f => f.id === id)
    if (idx !== -1) facturas.value[idx] = updated
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Error al anular la factura.')
  }
}

function confirmarEliminar(f: Factura) {
  facturaAEliminar.value = f
}

async function eliminar() {
  if (!facturaAEliminar.value) return
  isSubmitting.value = true
  try {
    await deleteFactura(facturaAEliminar.value.id)
    facturas.value = facturas.value.filter(f => f.id !== facturaAEliminar.value?.id)
    facturaAEliminar.value = null
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Error al eliminar la factura.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(load)
</script>
