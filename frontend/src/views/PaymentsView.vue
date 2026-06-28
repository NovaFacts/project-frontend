<template>
  <main class="page-main">
    <PageHeader
      title="Pagos"
      create-label="Registrar pago"
      :show-create-button="true"
      @create="openModal"
    />

    <!-- Lookup bar -->
    <div class="lookup-bar">
      <input
        v-model="lookupInvoiceId"
        type="number"
        min="1"
        placeholder="Buscar por ID de factura…"
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

    <!-- Load states -->
    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando pagos…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadData">Reintentar</button>
    </div>

    <div v-else-if="displayedPayments.length === 0" class="state-box state-box--empty">
      {{
        isLookupActive
          ? 'No se encontró ningún pago para esa factura.'
          : 'No hay pagos registrados. Registra el primero.'
      }}
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Factura</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Referencia</th>
            <th>Pagado</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in displayedPayments" :key="payment.id">
            <td>{{ payment.id }}</td>
            <td>#{{ payment.invoiceId }}</td>
            <td>{{ formatCurrency(payment.amount) }}</td>
            <td>{{ methodLabel(payment.paymentMethod) }}</td>
            <td>{{ payment.reference ?? '—' }}</td>
            <td>{{ formatDate(payment.paidAt) }}</td>
            <td>{{ formatDate(payment.createdAt) }}</td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--danger" @click="confirmDelete(payment)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Register payment modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">Registrar pago</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pay-invoice">Factura *</label>
          <select id="pay-invoice" v-model="form.invoiceId" required>
            <option value="" disabled>Selecciona una factura</option>
            <option v-for="inv in invoices" :key="inv.id" :value="String(inv.id)">
              #{{ inv.id }} — {{ formatCurrency(inv.total) }}
              ({{ invoiceStatusLabel(inv.status) }})
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="pay-method">Método de pago *</label>
          <select id="pay-method" v-model="form.paymentMethod" required>
            <option value="" disabled>Selecciona un método</option>
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label for="pay-reference">Referencia <span class="form-optional">(opcional)</span></label>
          <input
            id="pay-reference"
            v-model="form.reference"
            type="text"
            placeholder="Nº transacción, cheque…"
          />
        </div>
      </div>

      <p v-if="modalError" class="form-error">{{ modalError }}</p>

      <div class="modal-actions">
        <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
        <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Registrando…' : 'Registrar' }}
        </button>
      </div>
    </form>
  </AppModal>

  <!-- Delete confirmation modal -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDeleteModal">
    <h3 class="modal-title">Eliminar pago</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar el pago
      <strong>#{{ paymentToDelete?.id }}</strong>?
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
  getPayments,
  getPaymentByInvoice,
  createPayment,
  deletePayment,
} from '@/services/paymentService';
import { getInvoices } from '@/services/invoiceService';
import type { Payment, PaymentMethod, CreatePaymentRequest } from '@/types/payment';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

interface PaymentFormState {
  invoiceId: string;
  paymentMethod: string;
  reference: string;
}

const payments = ref<Payment[]>([]);
const invoices = ref<Invoice[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();
const { loading: isLookingUp, error: lookupError, clearError: clearLookupError, run: runLookup } = useAsyncState();

const lookupInvoiceId = ref('');
const lookupResult = ref<Payment | null>(null);
const isLookupActive = ref(false);

const showModal = ref(false);
const form = ref<PaymentFormState>({ invoiceId: '', paymentMethod: '', reference: '' });

const showDeleteModal = ref(false);
const paymentToDelete = ref<Payment | null>(null);

const displayedPayments = computed<Payment[]>(() =>
  isLookupActive.value
    ? (lookupResult.value ? [lookupResult.value] : [])
    : payments.value
);

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
};

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

function methodLabel(method: PaymentMethod): string {
  return METHOD_LABELS[method] ?? method;
}

function invoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABELS[status] ?? status;
}

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [payments.value, invoices.value] = await Promise.all([
      getPayments(),
      getInvoices(),
    ]);
  });
}

function openModal(): void {
  form.value = { invoiceId: '', paymentMethod: '', reference: '' };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.invoiceId) return 'Debes seleccionar una factura.';
  if (!form.value.paymentMethod) return 'Debes seleccionar un método de pago.';
  return null;
}

async function handleSubmit(): Promise<void> {
  const validationError = validate();
  if (validationError) {
    modalError.value = validationError;
    return;
  }
  await runSubmit(async () => {
    const ref = form.value.reference.trim();
    const payload: CreatePaymentRequest = {
      invoiceId: parseInt(form.value.invoiceId, 10),
      paymentMethod: form.value.paymentMethod as PaymentMethod,
      ...(ref ? { reference: ref } : {}),
    };
    const created = await createPayment(payload);
    payments.value.push(created);
    // The backend marks the invoice as PAID; refresh invoices to keep the select accurate
    invoices.value = await getInvoices();
    closeModal();
  });
}

function confirmDelete(payment: Payment): void {
  paymentToDelete.value = payment;
  showDeleteModal.value = true;
}

function cancelDeleteModal(): void {
  showDeleteModal.value = false;
  paymentToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!paymentToDelete.value) return;
  await runDelete(async () => {
    const deletedId = paymentToDelete.value!.id;
    await deletePayment(deletedId);
    payments.value = payments.value.filter(p => p.id !== deletedId);
    if (isLookupActive.value && lookupResult.value?.id === deletedId) {
      isLookupActive.value = false;
      lookupResult.value = null;
    }
    showDeleteModal.value = false;
    paymentToDelete.value = null;
  });
}

async function handleLookup(): Promise<void> {
  const id = parseInt(lookupInvoiceId.value, 10);
  if (!lookupInvoiceId.value || isNaN(id) || id <= 0) {
    lookupError.value = 'Ingresa un ID de factura válido.';
    return;
  }
  isLookupActive.value = false;
  lookupResult.value = null;
  await runLookup(async () => {
    lookupResult.value = await getPaymentByInvoice(id);
    isLookupActive.value = true;
  });
}

function clearLookup(): void {
  isLookupActive.value = false;
  lookupResult.value = null;
  lookupInvoiceId.value = '';
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

onMounted(loadData);
</script>

<style scoped>
.form-optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.75rem;
}
</style>
