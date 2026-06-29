<template>
  <main class="page-main">
    <PageHeader title="Dashboard" create-label="" :show-create-button="false" />

    <!-- ── Stat cards ──────────────────────────────────────── -->
    <div v-if="isStatsLoading" class="state-box state-box--sm">
      <span class="spinner" />
      <span>Cargando resumen…</span>
    </div>

    <div v-else-if="statsError" class="state-box state-box--error state-box--sm">
      {{ statsError }}
      <button class="btn btn--ghost btn--sm" @click="loadStats">Reintentar</button>
    </div>

    <template v-else-if="stats">
      <p class="section-label">General</p>
      <div class="stats-grid">
        <div class="stat-card stat-card--blue">
          <p class="stat-label">Huéspedes</p>
          <p class="stat-value">{{ stats.totalGuests }}</p>
        </div>
        <div class="stat-card stat-card--purple">
          <p class="stat-label">Propiedades</p>
          <p class="stat-value">{{ stats.totalProperties }}</p>
        </div>
      </div>

      <p class="section-label">Reservas</p>
      <div class="stats-grid">
        <div class="stat-card stat-card--green">
          <p class="stat-label">Confirmadas</p>
          <p class="stat-value">{{ stats.confirmedReservations }}</p>
        </div>
        <div class="stat-card stat-card--red">
          <p class="stat-label">Canceladas</p>
          <p class="stat-value">{{ stats.cancelledReservations }}</p>
        </div>
        <div class="stat-card stat-card--indigo">
          <p class="stat-label">Completadas</p>
          <p class="stat-value">{{ stats.completedReservations }}</p>
        </div>
      </div>

      <p class="section-label">Facturas</p>
      <div class="stats-grid">
        <div class="stat-card stat-card--amber">
          <p class="stat-label">Pendientes</p>
          <p class="stat-value">{{ stats.pendingInvoices }}</p>
        </div>
        <div class="stat-card stat-card--emerald">
          <p class="stat-label">Pagadas</p>
          <p class="stat-value">{{ stats.paidInvoices }}</p>
        </div>
        <div class="stat-card stat-card--red">
          <p class="stat-label">Canceladas</p>
          <p class="stat-value">{{ stats.cancelledInvoices }}</p>
        </div>
      </div>

      <p class="section-label">Financiero</p>
      <div class="stats-grid">
        <div class="stat-card stat-card--teal">
          <p class="stat-label">Pagos registrados</p>
          <p class="stat-value">{{ stats.totalPayments }}</p>
        </div>
        <div class="stat-card stat-card--revenue">
          <p class="stat-label">Ingresos totales</p>
          <p class="stat-value stat-value--revenue">{{ formatCurrency(stats.totalRevenue) }}</p>
        </div>
      </div>
    </template>

    <!-- ── Recent Reservations ─────────────────────────────── -->
    <div class="recent-section">
      <p class="section-label">Reservas recientes</p>

      <div v-if="isReservationsLoading" class="state-box state-box--sm">
        <span class="spinner" /><span>Cargando…</span>
      </div>

      <div v-else-if="reservationsError" class="state-box state-box--error state-box--sm">
        {{ reservationsError }}
        <button class="btn btn--ghost btn--sm" @click="loadReservationData">Reintentar</button>
      </div>

      <div v-else-if="recentReservations.length === 0" class="state-box state-box--empty state-box--sm">
        No hay reservas registradas.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Huésped</th>
              <th>Propiedad</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentReservations" :key="r.id">
              <td>{{ guestMap.get(r.guestId) ?? `Huésped #${r.guestId}` }}</td>
              <td>{{ propertyMap.get(r.propertyId) ?? `Propiedad #${r.propertyId}` }}</td>
              <td>{{ formatLocalDate(r.checkIn) }}</td>
              <td>{{ formatLocalDate(r.checkOut) }}</td>
              <td>
                <span class="badge" :class="RES_STATUS_CLASSES[r.status]">
                  {{ RES_STATUS_LABELS[r.status] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Recent Invoices ─────────────────────────────────── -->
    <div class="recent-section">
      <p class="section-label">Facturas recientes</p>

      <div v-if="isInvoicesLoading" class="state-box state-box--sm">
        <span class="spinner" /><span>Cargando…</span>
      </div>

      <div v-else-if="invoicesError" class="state-box state-box--error state-box--sm">
        {{ invoicesError }}
        <button class="btn btn--ghost btn--sm" @click="loadInvoices">Reintentar</button>
      </div>

      <div v-else-if="recentInvoices.length === 0" class="state-box state-box--empty state-box--sm">
        No hay facturas registradas.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Creada</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in recentInvoices" :key="inv.id">
              <td>#{{ inv.reservationId }}</td>
              <td>{{ formatCurrency(inv.total) }}</td>
              <td>
                <span class="badge" :class="INV_STATUS_CLASSES[inv.status]">
                  {{ INV_STATUS_LABELS[inv.status] }}
                </span>
              </td>
              <td>{{ formatDate(inv.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Recent Payments ─────────────────────────────────── -->
    <div class="recent-section">
      <p class="section-label">Pagos recientes</p>

      <div v-if="isPaymentsLoading" class="state-box state-box--sm">
        <span class="spinner" /><span>Cargando…</span>
      </div>

      <div v-else-if="paymentsError" class="state-box state-box--error state-box--sm">
        {{ paymentsError }}
        <button class="btn btn--ghost btn--sm" @click="loadPayments">Reintentar</button>
      </div>

      <div v-else-if="recentPayments.length === 0" class="state-box state-box--empty state-box--sm">
        No hay pagos registrados.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Pagado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pay in recentPayments" :key="pay.id">
              <td>#{{ pay.invoiceId }}</td>
              <td>{{ formatCurrency(pay.amount) }}</td>
              <td>{{ METHOD_LABELS[pay.paymentMethod] }}</td>
              <td>{{ formatDate(pay.paidAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import PageHeader from '@/components/PageHeader.vue';
import { getDashboardStats } from '@/services/dashboardService';
import { getReservations } from '@/services/reservationService';
import { getGuests } from '@/services/guestService';
import { getProperties } from '@/services/propertyService';
import { getInvoices } from '@/services/invoiceService';
import { getPayments } from '@/services/paymentService';
import type { DashboardStats } from '@/types/dashboard';
import type { Reservation, ReservationStatus } from '@/types/reservation';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
import type { Payment, PaymentMethod } from '@/types/payment';

// ── State ────────────────────────────────────────────────────
const stats       = ref<DashboardStats | null>(null);
const allRes      = ref<Reservation[]>([]);
const allInv      = ref<Invoice[]>([]);
const allPay      = ref<Payment[]>([]);
const guestMap    = ref(new Map<number, string>());
const propertyMap = ref(new Map<number, string>());

const { loading: isStatsLoading,        error: statsError,        run: runStats        } = useAsyncState();
const { loading: isReservationsLoading, error: reservationsError, run: runReservations } = useAsyncState();
const { loading: isInvoicesLoading,     error: invoicesError,     run: runInvoices     } = useAsyncState();
const { loading: isPaymentsLoading,     error: paymentsError,     run: runPayments     } = useAsyncState();

// ── Status/method label maps ─────────────────────────────────
const RES_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};
const RES_STATUS_CLASSES: Record<ReservationStatus, string> = {
  CONFIRMED: 'badge--confirmed',
  CANCELLED: 'badge--cancelled',
  COMPLETED: 'badge--completed',
};

const INV_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  PAID:    'Pagada',
  CANCELLED: 'Cancelada',
};
const INV_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  PENDING:   'badge--pending',
  PAID:      'badge--paid',
  CANCELLED: 'badge--cancelled',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:     'Efectivo',
  CARD:     'Tarjeta',
  TRANSFER: 'Transferencia',
  OTHER:    'Otro',
};

// ── Top-5 computeds ──────────────────────────────────────────
function byCreatedAtDesc<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

const recentReservations = computed(() => byCreatedAtDesc(allRes.value).slice(0, 5));
const recentInvoices     = computed(() => byCreatedAtDesc(allInv.value).slice(0, 5));
const recentPayments     = computed(() => byCreatedAtDesc(allPay.value).slice(0, 5));

// ── Load functions ────────────────────────────────────────────
async function loadStats(): Promise<void> {
  await runStats(async () => {
    stats.value = await getDashboardStats();
  });
}

async function loadReservationData(): Promise<void> {
  await runReservations(async () => {
    const [res, guests, props] = await Promise.all([
      getReservations(),
      getGuests(),
      getProperties(),
    ]);
    allRes.value = res;
    guestMap.value = new Map(
      guests.map(g => [g.id, `${g.documentNumber} — ${g.firstName} ${g.lastName}`])
    );
    propertyMap.value = new Map(
      props.map(p => [p.id, `${p.name} (${p.city})`])
    );
  });
}

async function loadInvoices(): Promise<void> {
  await runInvoices(async () => {
    allInv.value = await getInvoices();
  });
}

async function loadPayments(): Promise<void> {
  await runPayments(async () => {
    allPay.value = await getPayments();
  });
}

async function loadAll(): Promise<void> {
  await Promise.all([loadStats(), loadReservationData(), loadInvoices(), loadPayments()]);
}

// ── Formatters ────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

onMounted(loadAll);
</script>

<style scoped>
.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 24px 0 10px;
}

.section-label:first-of-type {
  margin-top: 0;
}

/* ── Stat cards ────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 4px;
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s;
}

.stat-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
  line-height: 1.1;
}

.stat-value--revenue {
  font-size: 1.5rem;
}

.stat-card--blue    { border-left-color: #2563eb; }
.stat-card--purple  { border-left-color: #9333ea; }
.stat-card--green   { border-left-color: #16a34a; }
.stat-card--red     { border-left-color: #dc2626; }
.stat-card--indigo  { border-left-color: #4f46e5; }
.stat-card--amber   { border-left-color: #d97706; }
.stat-card--emerald { border-left-color: #059669; }
.stat-card--teal    { border-left-color: #0891b2; }

.stat-card--revenue {
  border-left-color: #059669;
  background-color: #f0fdf4;
}

/* ── Recent sections ───────────────────────────────────────── */
.recent-section {
  margin-top: 8px;
}
</style>
