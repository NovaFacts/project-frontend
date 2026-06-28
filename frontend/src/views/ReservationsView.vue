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
            <th>Huésped</th>
            <th>Propiedad</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Huéspedes</th>
            <th>Estado</th>
            <th>Registrada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ reservation.id }}</td>
            <td>{{ guestLabel(reservation.guestId) }}</td>
            <td>{{ propertyLabel(reservation.propertyId) }}</td>
            <td>{{ formatLocalDate(reservation.checkIn) }}</td>
            <td>{{ formatLocalDate(reservation.checkOut) }}</td>
            <td>{{ reservation.guestCount }}</td>
            <td>
              <span class="badge" :class="statusClass(reservation.status)">
                {{ statusLabel(reservation.status) }}
              </span>
            </td>
            <td>{{ formatDate(reservation.createdAt) }}</td>
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
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-guest">Huésped *</label>
          <select id="res-guest" v-model="form.guestId" required>
            <option value="" disabled>Selecciona un huésped</option>
            <option v-for="g in guests" :key="g.id" :value="String(g.id)">
              {{ g.documentNumber }} — {{ g.firstName }} {{ g.lastName }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="res-property">Propiedad *</label>
          <select id="res-property" v-model="form.propertyId" required>
            <option value="" disabled>Selecciona una propiedad</option>
            <option v-for="p in properties" :key="p.id" :value="String(p.id)">
              {{ p.name }} ({{ p.city }})
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="res-checkin">Fecha de entrada *</label>
          <input
            id="res-checkin"
            v-model="form.checkIn"
            type="date"
            required
          />
        </div>
        <div class="form-group">
          <label for="res-checkout">Fecha de salida *</label>
          <input
            id="res-checkout"
            v-model="form.checkOut"
            type="date"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group" :class="{ 'form-group--full': modalMode === 'create' }">
          <label for="res-count">Nº de huéspedes *</label>
          <input
            id="res-count"
            v-model="form.guestCount"
            type="number"
            min="1"
            step="1"
            placeholder="2"
            required
          />
        </div>
        <div v-if="modalMode === 'edit'" class="form-group">
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
import { ref, computed, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import AppModal from '@/components/AppModal.vue';
import PageHeader from '@/components/PageHeader.vue';
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from '@/services/reservationService';
import { getGuests } from '@/services/guestService';
import { getProperties } from '@/services/propertyService';
import type { Reservation, ReservationStatus, CreateReservationRequest, UpdateReservationRequest } from '@/types/reservation';
import type { Guest } from '@/types/guest';
import type { Property } from '@/types/property';

interface ReservationFormState {
  guestId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestCount: string;
  status: string;
}

const reservations = ref<Reservation[]>([]);
const guests = ref<Guest[]>([]);
const properties = ref<Property[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();

const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedReservation = ref<Reservation | null>(null);

const showDeleteModal = ref(false);
const reservationToDelete = ref<Reservation | null>(null);

const emptyForm = (): ReservationFormState => ({
  guestId: '',
  propertyId: '',
  checkIn: '',
  checkOut: '',
  guestCount: '',
  status: 'CONFIRMED',
});

const form = ref<ReservationFormState>(emptyForm());

const guestMap = computed(() => {
  const m = new Map<number, string>();
  guests.value.forEach(g =>
    m.set(g.id, `${g.documentNumber} — ${g.firstName} ${g.lastName}`)
  );
  return m;
});

const propertyMap = computed(() => {
  const m = new Map<number, string>();
  properties.value.forEach(p => m.set(p.id, `${p.name} (${p.city})`));
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

function guestLabel(id: number): string {
  return guestMap.value.get(id) ?? `Huésped #${id}`;
}

function propertyLabel(id: number): string {
  return propertyMap.value.get(id) ?? `Propiedad #${id}`;
}

function statusLabel(status: ReservationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function statusClass(status: ReservationStatus): string {
  return STATUS_CLASSES[status] ?? '';
}

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [reservations.value, guests.value, properties.value] = await Promise.all([
      getReservations(),
      getGuests(),
      getProperties(),
    ]);
  });
}

function openCreateModal(): void {
  modalMode.value = 'create';
  selectedReservation.value = null;
  form.value = emptyForm();
  showModal.value = true;
}

function openEditModal(reservation: Reservation): void {
  modalMode.value = 'edit';
  selectedReservation.value = reservation;
  form.value = {
    guestId: String(reservation.guestId),
    propertyId: String(reservation.propertyId),
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guestCount: String(reservation.guestCount),
    status: reservation.status,
  };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.guestId) return 'El huésped es obligatorio.';
  if (!form.value.propertyId) return 'La propiedad es obligatoria.';
  if (!form.value.checkIn) return 'La fecha de entrada es obligatoria.';
  if (!form.value.checkOut) return 'La fecha de salida es obligatoria.';
  if (form.value.checkIn >= form.value.checkOut) {
    return 'La fecha de salida debe ser posterior a la de entrada.';
  }
  const count = parseInt(form.value.guestCount, 10);
  if (!form.value.guestCount || isNaN(count) || count < 1) {
    return 'El número de huéspedes debe ser al menos 1.';
  }
  if (modalMode.value === 'edit' && !form.value.status) {
    return 'El estado es obligatorio.';
  }
  return null;
}

async function handleSubmit(): Promise<void> {
  const validationError = validate();
  if (validationError) {
    modalError.value = validationError;
    return;
  }
  await runSubmit(async () => {
    const guestId = parseInt(form.value.guestId, 10);
    const propertyId = parseInt(form.value.propertyId, 10);
    const guestCount = parseInt(form.value.guestCount, 10);

    if (modalMode.value === 'create') {
      const payload: CreateReservationRequest = {
        guestId,
        propertyId,
        checkIn: form.value.checkIn,
        checkOut: form.value.checkOut,
        guestCount,
      };
      const created = await createReservation(payload);
      reservations.value.push(created);
    } else if (selectedReservation.value) {
      const payload: UpdateReservationRequest = {
        guestId,
        propertyId,
        checkIn: form.value.checkIn,
        checkOut: form.value.checkOut,
        guestCount,
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
    reservations.value = reservations.value.filter(
      r => r.id !== reservationToDelete.value!.id
    );
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(loadData);
</script>
