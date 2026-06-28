<template>
  <main class="page-main">
    <PageHeader
      title="Dashboard"
      create-label=""
      :show-create-button="false"
    />

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando resumen…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="load">Reintentar</button>
    </div>

    <template v-else-if="stats">
      <!-- General -->
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

      <!-- Reservations -->
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

      <!-- Invoices -->
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

      <!-- Financial -->
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
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import PageHeader from '@/components/PageHeader.vue';
import { getDashboardStats } from '@/services/dashboardService';
import type { DashboardStats } from '@/types/dashboard';

const stats = ref<DashboardStats | null>(null);
const { loading: isLoading, error: errorMessage, run } = useAsyncState();

async function load(): Promise<void> {
  await run(async () => {
    stats.value = await getDashboardStats();
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

onMounted(load);
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

/* Accent colours */
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
</style>
