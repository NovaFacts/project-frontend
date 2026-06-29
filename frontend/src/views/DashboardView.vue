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
          <p class="stat-label">Clientes</p>
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
          <p class="stat-label">Anticipos registrados</p>
          <p class="stat-value">{{ stats.totalAnticipos }}</p>
        </div>
        <div class="stat-card stat-card--revenue">
          <p class="stat-label">Monto total anticipos</p>
          <p class="stat-value stat-value--revenue">{{ formatCurrency(stats.montoTotalAnticipos) }}</p>
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
              <th>Cliente</th>
              <th>Propiedad</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentReservations" :key="r.id">
              <td>{{ r.clienteNombre }}</td>
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

    <!-- ── Recent Facturas ───────────────────────────────────── -->
    <div class="recent-section">
      <p class="section-label">Facturas recientes</p>

      <div v-if="isFacturasLoading" class="state-box state-box--sm">
        <span class="spinner" /><span>Cargando…</span>
      </div>

      <div v-else-if="facturasError" class="state-box state-box--error state-box--sm">
        {{ facturasError }}
        <button class="btn btn--ghost btn--sm" @click="loadFacturas">Reintentar</button>
      </div>

      <div v-else-if="recentFacturas.length === 0" class="state-box state-box--empty state-box--sm">
        No hay facturas registradas.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>N.º Factura</th>
              <th>Reserva</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Emitida</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in recentFacturas" :key="f.id">
              <td>{{ f.numeroFactura }}</td>
              <td>#{{ f.reservaId }}</td>
              <td>{{ formatCurrency(f.total) }}</td>
              <td>
                <span class="badge" :class="FAC_STATUS_CLASSES[f.estado]">
                  {{ FAC_STATUS_LABELS[f.estado] }}
                </span>
              </td>
              <td>{{ formatDate(f.emitidaEn) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Recent Anticipos ────────────────────────────────── -->
    <div class="recent-section">
      <p class="section-label">Anticipos recientes</p>

      <div v-if="isAnticiposLoading" class="state-box state-box--sm">
        <span class="spinner" /><span>Cargando…</span>
      </div>

      <div v-else-if="anticiposError" class="state-box state-box--error state-box--sm">
        {{ anticiposError }}
        <button class="btn btn--ghost btn--sm" @click="loadAnticipos">Reintentar</button>
      </div>

      <div v-else-if="recentAnticipos.length === 0" class="state-box state-box--empty state-box--sm">
        No hay anticipos registrados.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha pago</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in recentAnticipos" :key="a.id">
              <td>#{{ a.reservaId }}</td>
              <td>{{ formatCurrency(a.monto) }}</td>
              <td>{{ a.metodoPago ?? '—' }}</td>
              <td>
                <span class="badge" :class="estadoClass(a.estado)">{{ a.estado }}</span>
              </td>
              <td>{{ formatLocalDate(a.fechaPago) }}</td>
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
import { getProperties } from '@/services/propertyService';
import { getFacturas } from '@/services/facturaService';
import { getAnticipos } from '@/services/anticipoService';
import type { DashboardStats } from '@/types/dashboard';
import type { Reservation, ReservationStatus } from '@/types/reservation';
import type { Factura, FacturaEstado } from '@/types/factura';
import type { Anticipo } from '@/types/anticipo';

// ── State ────────────────────────────────────────────────────
const stats       = ref<DashboardStats | null>(null);
const allRes      = ref<Reservation[]>([]);
const allFac      = ref<Factura[]>([]);
const allAnt      = ref<Anticipo[]>([]);
const propertyMap = ref(new Map<number, string>());

const { loading: isStatsLoading,        error: statsError,        run: runStats        } = useAsyncState();
const { loading: isReservationsLoading, error: reservationsError, run: runReservations } = useAsyncState();
const { loading: isFacturasLoading,     error: facturasError,     run: runFacturas     } = useAsyncState();
const { loading: isAnticiposLoading,    error: anticiposError,    run: runAnticipos    } = useAsyncState();

// ── Status label maps ────────────────────────────────────────
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

const FAC_STATUS_LABELS: Record<FacturaEstado, string> = {
  PENDING:   'Pendiente',
  PAID:      'Emitida',
  CANCELLED: 'Anulada',
};
const FAC_STATUS_CLASSES: Record<FacturaEstado, string> = {
  PENDING:   'badge--pending',
  PAID:      'badge--paid',
  CANCELLED: 'badge--cancelled',
};

function estadoClass(estado: string): string {
  if (estado === 'registrado') return 'badge--pending';
  if (estado === 'aplicado')   return 'badge--paid';
  if (estado === 'devuelto')   return 'badge--cancelled';
  return '';
}

// ── Top-5 computeds ──────────────────────────────────────────
const recentReservations = computed(() =>
  [...allRes.value]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5)
);
const recentFacturas = computed(() =>
  [...allFac.value]
    .sort((a, b) => +new Date(b.emitidaEn) - +new Date(a.emitidaEn))
    .slice(0, 5)
);
const recentAnticipos = computed(() =>
  [...allAnt.value]
    .sort((a, b) => +new Date(b.registradoEn) - +new Date(a.registradoEn))
    .slice(0, 5)
);

// ── Load functions ────────────────────────────────────────────
async function loadStats(): Promise<void> {
  await runStats(async () => {
    stats.value = await getDashboardStats();
  });
}

async function loadReservationData(): Promise<void> {
  await runReservations(async () => {
    const [res, props] = await Promise.all([getReservations(), getProperties()]);
    allRes.value = res;
    propertyMap.value = new Map(props.map(p => [p.id, p.name]));
  });
}

async function loadFacturas(): Promise<void> {
  await runFacturas(async () => {
    allFac.value = await getFacturas();
  });
}

async function loadAnticipos(): Promise<void> {
  await runAnticipos(async () => {
    allAnt.value = await getAnticipos();
  });
}

async function loadAll(): Promise<void> {
  await Promise.all([loadStats(), loadReservationData(), loadFacturas(), loadAnticipos()]);
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
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
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
