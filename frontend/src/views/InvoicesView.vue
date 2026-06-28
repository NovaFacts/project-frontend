<template>
  <main class="page-main">
    <PageHeader
      title="Facturas"
      create-label="Generar factura"
      :show-create-button="true"
      @create="openModal"
    />

    <!-- Lookup bar -->
    <div class="lookup-bar">
      <input
        v-model="lookupReservationId"
        type="number"
        min="1"
        placeholder="Buscar por ID de reserva…"
        @keydown.enter="handleLookup"
      />
      <button class="btn btn--ghost" :disabled="isLookingUp" @click="handleLookup">
        {{ isLookingUp ? 'Buscando…' : 'Buscar' }}
      </button>
      <button v-if="isLookupActive" class="btn btn--ghost" @click="clearLookup">
        Limpiar filtro
      </button>
    </div>
    <p v-if="lookupError" class="page-error">{{ lookupError }}</p>

    <!-- Cancel error banner -->
    <p v-if="cancelError" class="page-error">{{ cancelError }}</p>

    <!-- Load states -->
    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando facturas…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadData">Reintentar</button>
    </div>

    <div v-else-if="displayedInvoices.length === 0" class="state-box state-box--empty">
      {{
        isLookupActive
          ? 'No se encontró ninguna factura para esa reserva.'
          : 'No hay facturas registradas. Genera la primera.'
      }}
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reserva</th>
            <th>Subtotal</th>
            <th>IVA</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Creada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in displayedInvoices" :key="invoice.id">
            <td>{{ invoice.id }}</td>
            <td>#{{ invoice.reservationId }}</td>
            <td>{{ formatCurrency(invoice.subtotal) }}</td>
            <td>{{ formatCurrency(invoice.tax) }}</td>
            <td>{{ formatCurrency(invoice.total) }}</td>
            <td>
              <span class="badge" :class="statusClass(invoice.status)">
                {{ statusLabel(invoice.status) }}
              </span>
            </td>
            <td>{{ formatDate(invoice.createdAt) }}</td>
            <td class="actions-cell">
              <button
                v-if="invoice.status === 'PENDING'"
                class="btn btn--sm btn--ghost"
                :disabled="isCancelling && cancellingId === invoice.id"
                @click="handleCancel(invoice)"
              >
                {{ isCancelling && cancellingId === invoice.id ? 'Cancelando…' : 'Cancelar' }}
              </button>
              <button class="btn btn--sm btn--danger" @click="confirmDelete(invoice)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Generate invoice modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">Generar factura</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="inv-reservation">Reserva *</label>
          <select id="inv-reservation" v-model="form.reservationId" required>
            <option value="" disabled>Selecciona una reserva</option>
            <option v-for="r in reservations" :key="r.id" :value="String(r.id)">
              #{{ r.id }} — {{ formatLocalDate(r.checkIn) }} → {{ formatLocalDate(r.checkOut) }}
              ({{ r.status === 'CONFIRMED' ? 'Confirmada' : r.status === 'CANCELLED' ? 'Cancelada' : 'Completada' }})
            </option>
          </select>
        </div>
      </div>

      <p v-if="modalError" class="form-error">{{ modalError }}</p>

      <div class="modal-actions">
        <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
        <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Generando…' : 'Generar' }}
        </button>
      </div>
    </form>
  </AppModal>

  <!-- Delete confirmation modal -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDeleteModal">
    <h3 class="modal-title">Eliminar factura</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar la factura
      <strong>#{{ invoiceToDelete?.id }}</strong>?
      Esta acción no se puede deshacer.
    </p>
    <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
    <div class="modal-actions">
      <button class="btn btn--ghost" @click="cancelDeleteModal">Cancelar</button>
      <button class="btn btn--danger" :disabled="isDeleting" @click="handleDelete">
        {{ isDeleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import AppModal from '@/components/AppModal.vue';
import PageHeader from '@/components/PageHeader.vue';
import {
  getInvoices,
  getInvoiceByReservation,
  createInvoice,
  cancelInvoice,
  deleteInvoice,
} from '@/services/invoiceService';
import { getReservations } from '@/services/reservationService';
import type { Invoice, InvoiceStatus, CreateInvoiceRequest } from '@/types/invoice';
import type { Reservation } from '@/types/reservation';

interface InvoiceFormState {
  reservationId: string;
}

const invoices = ref<Invoice[]>([]);
const reservations = ref<Reservation[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isCancelling, error: cancelError, run: runCancel } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();
const { loading: isLookingUp, error: lookupError, clearError: clearLookupError, run: runLookup } = useAsyncState();

const cancellingId = ref<number | null>(null);

const lookupReservationId = ref('');
const lookupResult = ref<Invoice | null>(null);
const isLookupActive = ref(false);

const showModal = ref(false);
const form = ref<InvoiceFormState>({ reservationId: '' });

const showDeleteModal = ref(false);
const invoiceToDelete = ref<Invoice | null>(null);

const displayedInvoices = computed<Invoice[]>(() =>
  isLookupActive.value
    ? (lookupResult.value ? [lookupResult.value] : [])
    : invoices.value
);

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  PENDING: 'badge--pending',
  PAID: 'badge--paid',
  CANCELLED: 'badge--cancelled',
};

function statusLabel(status: InvoiceStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function statusClass(status: InvoiceStatus): string {
  return STATUS_CLASSES[status] ?? '';
}

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [invoices.value, reservations.value] = await Promise.all([
      getInvoices(),
      getReservations(),
    ]);
  });
}

function openModal(): void {
  form.value = { reservationId: '' };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validateForm(): string | null {
  if (!form.value.reservationId) return 'Debes seleccionar una reserva.';
  return null;
}

async function handleSubmit(): Promise<void> {
  const validationError = validateForm();
  if (validationError) {
    modalError.value = validationError;
    return;
  }
  await runSubmit(async () => {
    const payload: CreateInvoiceRequest = {
      reservationId: parseInt(form.value.reservationId, 10),
    };
    const created = await createInvoice(payload);
    invoices.value.push(created);
    closeModal();
  });
}

async function handleCancel(invoice: Invoice): Promise<void> {
  if (isCancelling.value) return;
  cancellingId.value = invoice.id;
  await runCancel(async () => {
    const updated = await cancelInvoice(invoice.id);
    const idx = invoices.value.findIndex(i => i.id === updated.id);
    if (idx !== -1) invoices.value[idx] = updated;
    if (isLookupActive.value && lookupResult.value?.id === updated.id) {
      lookupResult.value = updated;
    }
  });
  cancellingId.value = null;
}

function confirmDelete(invoice: Invoice): void {
  invoiceToDelete.value = invoice;
  showDeleteModal.value = true;
}

function cancelDeleteModal(): void {
  showDeleteModal.value = false;
  invoiceToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!invoiceToDelete.value) return;
  await runDelete(async () => {
    const deletedId = invoiceToDelete.value!.id;
    await deleteInvoice(deletedId);
    invoices.value = invoices.value.filter(i => i.id !== deletedId);
    if (isLookupActive.value && lookupResult.value?.id === deletedId) {
      isLookupActive.value = false;
      lookupResult.value = null;
    }
    showDeleteModal.value = false;
    invoiceToDelete.value = null;
  });
}

async function handleLookup(): Promise<void> {
  const id = parseInt(lookupReservationId.value, 10);
  if (!lookupReservationId.value || isNaN(id) || id <= 0) {
    lookupError.value = 'Ingresa un ID de reserva válido.';
    return;
  }
  isLookupActive.value = false;
  lookupResult.value = null;
  await runLookup(async () => {
    lookupResult.value = await getInvoiceByReservation(id);
    isLookupActive.value = true;
  });
}

function clearLookup(): void {
  isLookupActive.value = false;
  lookupResult.value = null;
  lookupReservationId.value = '';
  clearLookupError();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(loadData);
</script>
