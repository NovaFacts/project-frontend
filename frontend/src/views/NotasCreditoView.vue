<template>
  <main class="page-main">
    <div class="page-header">
      <h1>Notas de Crédito</h1>
      <button class="btn btn--primary" @click="openModal">Nueva nota de crédito</button>
    </div>

    <div v-if="isLoading" class="state-box"><span class="spinner" /></div>
    <p v-else-if="error" class="page-error">{{ error }}</p>

    <table v-else-if="notas.length" class="data-table">
      <thead>
        <tr>
          <th>N.º Nota</th>
          <th>Factura</th>
          <th>Monto</th>
          <th>Motivo</th>
          <th>Emitida por</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in notas" :key="n.id">
          <td>{{ n.numeroNota }}</td>
          <td>{{ n.numeroFactura }}</td>
          <td>{{ fmt(n.monto) }}</td>
          <td>{{ n.motivo ?? '—' }}</td>
          <td>{{ n.usuarioNombre }}</td>
          <td>{{ n.emitidaEn?.slice(0, 10) }}</td>
          <td class="actions">
            <button class="btn btn--sm btn--danger" @click="confirmarEliminar(n)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="state-box">No hay notas de crédito registradas.</p>

    <!-- Modal crear nota -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Nueva nota de crédito</h2>
        <form @submit.prevent="submitForm">

          <label>Factura</label>
          <select v-model.number="form.facturaId" required>
            <option disabled value="">— Seleccione factura —</option>
            <option v-for="f in facturas" :key="f.id" :value="f.id">
              {{ f.numeroFactura }} — Reserva #{{ f.reservaId }} ({{ estadoLabel(f.estado) }})
            </option>
          </select>

          <label>Monto</label>
          <input v-model.number="form.monto" type="number" min="0.01" step="0.01" required />

          <label>Motivo <span class="opt">(opcional)</span></label>
          <textarea v-model="form.motivo" rows="3" maxlength="500" />

          <p v-if="formError" class="page-error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando…' : 'Crear nota' }}
            </button>
            <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirmar eliminación -->
    <div v-if="notaAEliminar" class="modal-overlay" @click.self="notaAEliminar = null">
      <div class="modal modal--sm">
        <h2>¿Eliminar nota de crédito?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn btn--danger" :disabled="isSubmitting" @click="eliminar">
            {{ isSubmitting ? 'Eliminando…' : 'Eliminar' }}
          </button>
          <button class="btn btn--ghost" @click="notaAEliminar = null">Cancelar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getNotasCredito, createNotaCredito, deleteNotaCredito } from '../services/notaCreditoService'
import { getFacturas } from '../services/facturaService'
import type { NotaCredito, CreateNotaCreditoRequest } from '../types/notaCredito'
import type { Factura } from '../types/factura'

const notas = ref<NotaCredito[]>([])
const facturas = ref<Factura[]>([])
const isLoading = ref(false)
const error = ref('')
const showModal = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const notaAEliminar = ref<NotaCredito | null>(null)

const emptyForm = () => ({ facturaId: '' as number | '', monto: 0, motivo: '' })
const form = ref(emptyForm())

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(n ?? 0)
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
    const [ns, fs] = await Promise.all([getNotasCredito(), getFacturas()])
    notas.value = ns
    facturas.value = fs
  } catch {
    error.value = 'Error al cargar notas de crédito.'
  } finally {
    isLoading.value = false
  }
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
  if (!form.value.facturaId) { formError.value = 'Seleccione una factura.'; return }
  isSubmitting.value = true
  formError.value = ''
  try {
    const payload: CreateNotaCreditoRequest = {
      facturaId: Number(form.value.facturaId),
      monto: form.value.monto,
      motivo: form.value.motivo || undefined
    }
    const created = await createNotaCredito(payload)
    notas.value.unshift(created)
    closeModal()
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error al crear la nota de crédito.'
  } finally {
    isSubmitting.value = false
  }
}

function confirmarEliminar(n: NotaCredito) {
  notaAEliminar.value = n
}

async function eliminar() {
  if (!notaAEliminar.value) return
  isSubmitting.value = true
  try {
    await deleteNotaCredito(notaAEliminar.value.id)
    notas.value = notas.value.filter(n => n.id !== notaAEliminar.value?.id)
    notaAEliminar.value = null
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Error al eliminar la nota de crédito.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(load)
</script>
