<template>
  <main class="page-main">
    <PageHeader
      title="Gestión de Reservas"
      create-label="+ Nueva reserva"
      :show-create-button="true"
      @create="openCreateModal"
    />

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando reservas…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadData">Reintentar</button>
    </div>

    <div v-else-if="reservations.length === 0" class="state-box state-box--empty">
      No hay reservas registradas. Crea la primera.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Propiedad</th>
            <th>Canal</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Huéspedes</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ reservation.id }}</td>
            <td>
              <span>{{ reservation.clienteNombre }}</span>
              <span v-if="reservation.clienteEmail" class="secondary-text">{{ reservation.clienteEmail }}</span>
            </td>
            <td>{{ propertyLabel(reservation.propertyId) }}</td>
            <td>{{ reservation.canalNombre }}</td>
            <td>{{ formatLocalDate(reservation.checkIn) }}</td>
            <td>{{ formatLocalDate(reservation.checkOut) }}</td>
            <td>{{ reservation.guestCount }}</td>
            <td>{{ formatCurrency(reservation.montoTotal) }}</td>
            <td>
              <span class="badge" :class="statusClass(reservation.status)">
                {{ statusLabel(reservation.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--ghost" @click="openEditModal(reservation)">Editar</button>
              <button class="btn btn--sm btn--danger" @click="confirmDelete(reservation)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Create / Edit modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">{{ modalMode === 'create' ? 'Nueva reserva' : 'Editar reserva' }}</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <!-- Client data -->
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-cliente">Nombre del cliente *</label>
          <input id="res-cliente" v-model="form.clienteNombre" type="text"
                 required maxlength="150" placeholder="Ej: Ana Rodríguez" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="res-email">Correo del cliente</label>
          <input id="res-email" v-model="form.clienteEmail" type="email"
                 maxlength="150" placeholder="cliente@email.com" />
        </div>
        <div class="form-group">
          <label for="res-tel">Teléfono del cliente</label>
          <input id="res-tel" v-model="form.clienteTelefono" type="tel"
                 maxlength="50" placeholder="+57 300 000 0000" />
        </div>
      </div>

      <!-- Property -->
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-property">Propiedad *</label>
          <select id="res-property" v-model="form.propertyId" required @change="onPropertyChange">
            <option value="" disabled>Selecciona una propiedad</option>
            <option v-for="p in activeProperties" :key="p.id" :value="String(p.id)">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Canal -->
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-canal">Canal *</label>
          <select id="res-canal" v-model="form.canalId" required>
            <option value="" disabled>Selecciona un canal</option>
            <option v-for="c in canales" :key="c.id" :value="String(c.id)">
              {{ c.nombre }} ({{ c.tipo }})
            </option>
          </select>
        </div>
      </div>

      <!-- Temporada -->
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-temporada">Temporada *</label>
          <select id="res-temporada" v-model="form.temporadaId" required>
            <option value="" disabled>Selecciona una temporada</option>
            <option v-for="t in temporadas" :key="t.id" :value="String(t.id)">
              {{ t.nombre }}
            </option>
          </select>
        </div>
      </div>

      <!-- Politica de cancelación (filtered by selected property) -->
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-politica">Política de cancelación *</label>
          <select id="res-politica" v-model="form.politicaCancelacionId" required
                  :disabled="!form.propertyId">
            <option value="" disabled>
              {{ form.propertyId ? 'Selecciona una política' : 'Primero selecciona una propiedad' }}
            </option>
            <option v-for="pol in politicasDePropiedad" :key="pol.id" :value="String(pol.id)">
              {{ pol.nombre }} ({{ pol.porcentajeReembolso }}% reembolso, {{ pol.diasAviso }} días)
            </option>
          </select>
        </div>
      </div>

      <!-- Dates and guest count -->
      <div class="form-row">
        <div class="form-group">
          <label for="res-checkin">Fecha de entrada *</label>
          <input id="res-checkin" v-model="form.checkIn" type="date" required />
        </div>
        <div class="form-group">
          <label for="res-checkout">Fecha de salida *</label>
          <input id="res-checkout" v-model="form.checkOut" type="date" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="res-monto">Monto total (COP) *</label>
          <input id="res-monto" v-model="form.montoTotal" type="number"
                 min="0" step="1000" placeholder="500000" required />
        </div>
        <div class="form-group">
          <label for="res-count">Nº de huéspedes *</label>
          <input id="res-count" v-model="form.guestCount" type="number"
                 min="1" step="1" placeholder="2" required />
        </div>
      </div>

      <div v-if="modalMode === 'edit'" class="form-row">
        <div class="form-group form-group--full">
          <label for="res-status">Estado *</label>
          <select id="res-status" v-model="form.status" required>
            <option value="CONFIRMED">Confirmada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="COMPLETED">Completada</option>
          </select>
        </div>
      </div>

      <p v-if="modalError" class="form-error">{{ modalError }}</p>

      <div class="modal-actions">
        <button type="button" class="btn btn--ghost" @click="closeModal">Cancelar</button>
        <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>
  </AppModal>

  <!-- Delete confirmation modal -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDelete">
    <h3 class="modal-title">Eliminar reserva</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar la reserva
      <strong>#{{ reservationToDelete?.id }}</strong>?
      Esta acción no se puede deshacer.
    </p>
    <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
    <div class="modal-actions">
      <button class="btn btn--ghost" @click="cancelDelete">Cancelar</button>
      <button class="btn btn--danger" :disabled="isDeleting" @click="handleDelete">
        {{ isDeleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import AppModal from '@/components/AppModal.vue';
import PageHeader from '@/components/PageHeader.vue';
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from '@/services/reservationService';
import { getProperties } from '@/services/propertyService';
import { getCanales } from '@/services/canalService';
import { getTemporadas } from '@/services/temporadaService';
import { getPoliticasByPropiedad } from '@/services/politicaCancelacionService';
import type { Reservation, ReservationStatus, CreateReservationRequest, UpdateReservationRequest } from '@/types/reservation';
import type { Property } from '@/types/property';
import type { Canal } from '@/types/canal';
import type { Temporada } from '@/types/temporada';
import type { PoliticaCancelacion } from '@/types/politicaCancelacion';

interface ReservationFormState {
  propertyId: string;
  canalId: string;
  temporadaId: string;
  politicaCancelacionId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  montoTotal: string;
  checkIn: string;
  checkOut: string;
  guestCount: string;
  status: string;
}

const reservations = ref<Reservation[]>([]);
const properties = ref<Property[]>([]);
const canales = ref<Canal[]>([]);
const temporadas = ref<Temporada[]>([]);
const politicasDePropiedad = ref<PoliticaCancelacion[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();

const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedReservation = ref<Reservation | null>(null);

const showDeleteModal = ref(false);
const reservationToDelete = ref<Reservation | null>(null);

const emptyForm = (): ReservationFormState => ({
  propertyId: '',
  canalId: '',
  temporadaId: '',
  politicaCancelacionId: '',
  clienteNombre: '',
  clienteEmail: '',
  clienteTelefono: '',
  montoTotal: '',
  checkIn: '',
  checkOut: '',
  guestCount: '',
  status: 'CONFIRMED',
});

const form = ref<ReservationFormState>(emptyForm());

const activeProperties = computed(() => properties.value.filter(p => p.activa));

const propertyMap = computed(() => {
  const m = new Map<number, string>();
  properties.value.forEach(p => m.set(p.id, p.name));
  return m;
});

const STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const STATUS_CLASSES: Record<ReservationStatus, string> = {
  CONFIRMED: 'badge--confirmed',
  CANCELLED: 'badge--cancelled',
  COMPLETED: 'badge--completed',
};

function propertyLabel(id: number): string {
  return propertyMap.value.get(id) ?? `Propiedad #${id}`;
}

function statusLabel(status: ReservationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function statusClass(status: ReservationStatus): string {
  return STATUS_CLASSES[status] ?? '';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

// Fetch politicas whenever the selected property changes
watch(() => form.value.propertyId, async (propId) => {
  form.value.politicaCancelacionId = '';
  politicasDePropiedad.value = [];
  if (propId) {
    try {
      politicasDePropiedad.value = await getPoliticasByPropiedad(Number(propId));
    } catch {
      politicasDePropiedad.value = [];
    }
  }
});

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [reservations.value, properties.value, canales.value, temporadas.value] = await Promise.all([
      getReservations(),
      getProperties(),
      getCanales(),
      getTemporadas(),
    ]);
  });
}

function openCreateModal(): void {
  modalMode.value = 'create';
  selectedReservation.value = null;
  form.value = emptyForm();
  politicasDePropiedad.value = [];
  showModal.value = true;
}

async function openEditModal(reservation: Reservation): Promise<void> {
  modalMode.value = 'edit';
  selectedReservation.value = reservation;
  form.value = {
    propertyId: String(reservation.propertyId),
    canalId: String(reservation.canalId),
    temporadaId: String(reservation.temporadaId),
    politicaCancelacionId: String(reservation.politicaCancelacionId),
    clienteNombre: reservation.clienteNombre,
    clienteEmail: reservation.clienteEmail ?? '',
    clienteTelefono: reservation.clienteTelefono ?? '',
    montoTotal: String(reservation.montoTotal),
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guestCount: String(reservation.guestCount),
    status: reservation.status,
  };
  // Fetch politicas for this property so the dropdown is populated
  if (reservation.propertyId) {
    try {
      politicasDePropiedad.value = await getPoliticasByPropiedad(reservation.propertyId);
    } catch {
      politicasDePropiedad.value = [];
    }
  }
  showModal.value = true;
}

function onPropertyChange(): void {
  // Watcher handles the fetch; this prevents stale politica selection
  form.value.politicaCancelacionId = '';
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.clienteNombre.trim()) return 'El nombre del cliente es obligatorio.';
  if (!form.value.propertyId) return 'La propiedad es obligatoria.';
  if (!form.value.canalId) return 'El canal es obligatorio.';
  if (!form.value.temporadaId) return 'La temporada es obligatoria.';
  if (!form.value.politicaCancelacionId) return 'La política de cancelación es obligatoria.';
  if (!form.value.checkIn) return 'La fecha de entrada es obligatoria.';
  if (!form.value.checkOut) return 'La fecha de salida es obligatoria.';
  if (form.value.checkIn >= form.value.checkOut) {
    return 'La fecha de salida debe ser posterior a la de entrada.';
  }
  const monto = parseFloat(form.value.montoTotal);
  if (!form.value.montoTotal || isNaN(monto) || monto < 0) {
    return 'El monto total debe ser un valor positivo.';
  }
  const count = parseInt(form.value.guestCount, 10);
  if (!form.value.guestCount || isNaN(count) || count < 1) {
    return 'El número de huéspedes debe ser al menos 1.';
  }
  if (modalMode.value === 'edit' && !form.value.status) return 'El estado es obligatorio.';
  return null;
}

async function handleSubmit(): Promise<void> {
  const validationError = validate();
  if (validationError) {
    modalError.value = validationError;
    return;
  }
  await runSubmit(async () => {
    const basePayload = {
      propertyId: Number(form.value.propertyId),
      canalId: Number(form.value.canalId),
      temporadaId: Number(form.value.temporadaId),
      politicaCancelacionId: Number(form.value.politicaCancelacionId),
      clienteNombre: form.value.clienteNombre.trim(),
      clienteEmail: form.value.clienteEmail.trim() || undefined,
      clienteTelefono: form.value.clienteTelefono.trim() || undefined,
      montoTotal: parseFloat(form.value.montoTotal),
      checkIn: form.value.checkIn,
      checkOut: form.value.checkOut,
      guestCount: parseInt(form.value.guestCount, 10),
    };

    if (modalMode.value === 'create') {
      const payload: CreateReservationRequest = basePayload;
      const created = await createReservation(payload);
      reservations.value.push(created);
    } else if (selectedReservation.value) {
      const payload: UpdateReservationRequest = {
        ...basePayload,
        status: form.value.status as ReservationStatus,
      };
      const updated = await updateReservation(selectedReservation.value.id, payload);
      const index = reservations.value.findIndex(r => r.id === updated.id);
      if (index !== -1) reservations.value[index] = updated;
    }
    closeModal();
  });
}

function confirmDelete(reservation: Reservation): void {
  reservationToDelete.value = reservation;
  showDeleteModal.value = true;
}

function cancelDelete(): void {
  showDeleteModal.value = false;
  reservationToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!reservationToDelete.value) return;
  await runDelete(async () => {
    await deleteReservation(reservationToDelete.value!.id);
    reservations.value = reservations.value.filter(r => r.id !== reservationToDelete.value!.id);
    showDeleteModal.value = false;
    reservationToDelete.value = null;
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

<style scoped>
.secondary-text {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
