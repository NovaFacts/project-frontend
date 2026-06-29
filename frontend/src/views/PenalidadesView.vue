<template>
  <main class="page-main">
    <PageHeader
      title="Penalidades"
      create-label="Registrar penalidad"
      :show-create-button="true"
      @create="openModal"
    />

    <!-- Lookup bar -->
    <div class="lookup-bar">
      <input
        v-model="lookupReservaId"
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

    <!-- Load states -->
    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando penalidades…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadData">Reintentar</button>
    </div>

    <div v-else-if="displayedPenalidades.length === 0" class="state-box state-box--empty">
      {{
        isLookupActive
          ? 'No se encontraron penalidades para esa reserva.'
          : 'No hay penalidades registradas.'
      }}
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reserva</th>
            <th>M. Política</th>
            <th>M. Aprobado</th>
            <th>M. Condonado</th>
            <th>Fecha cancelación</th>
            <th>Motivo</th>
            <th>Registrado por</th>
            <th>Calculado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in displayedPenalidades" :key="p.id">
            <td>{{ p.id }}</td>
            <td>#{{ p.reservaId }}</td>
            <td>{{ formatCurrency(p.montoSegunPolitica) }}</td>
            <td>{{ formatCurrency(p.montoAprobado) }}</td>
            <td>{{ formatCurrency(p.montoCondonado) }}</td>
            <td>{{ formatLocalDate(p.fechaCancelacion) }}</td>
            <td>{{ p.motivo ?? '—' }}</td>
            <td>{{ p.usuarioNombre }}</td>
            <td>{{ formatDate(p.calculadoEn) }}</td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--danger" @click="confirmDelete(p)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Registrar penalidad modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">Registrar penalidad</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pen-reserva">Reserva *</label>
          <select id="pen-reserva" v-model="form.reservaId" required>
            <option value="" disabled>Selecciona una reserva</option>
            <option v-for="r in reservations" :key="r.id" :value="String(r.id)">
              #{{ r.id }} — {{ r.clienteNombre }}
              ({{ formatLocalDate(r.checkIn) }} → {{ formatLocalDate(r.checkOut) }})
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="pen-segun">Monto según política *</label>
          <input
            id="pen-segun"
            v-model="form.montoSegunPolitica"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
        <div class="form-group">
          <label for="pen-aprobado">Monto aprobado *</label>
          <input
            id="pen-aprobado"
            v-model="form.montoAprobado"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="pen-condonado">
            Monto condonado <span class="form-optional">(opcional)</span>
          </label>
          <input
            id="pen-condonado"
            v-model="form.montoCondonado"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div class="form-group">
          <label for="pen-fecha">Fecha de cancelación *</label>
          <input id="pen-fecha" v-model="form.fechaCancelacion" type="date" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pen-motivo">
            Motivo <span class="form-optional">(opcional)</span>
          </label>
          <textarea id="pen-motivo" v-model="form.motivo" rows="3" placeholder="Describe el motivo de la penalidad…" />
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

  <!-- Confirmación de eliminación -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDelete">
    <h3 class="modal-title">Eliminar penalidad</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar la penalidad
      <strong>#{{ penalidadToDelete?.id }}</strong>?
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
  getPenalidades,
  getPenalidadesByReserva,
  createPenalidad,
  deletePenalidad,
} from '@/services/penalidadService';
import { getReservations } from '@/services/reservationService';
import type { Penalidad, CreatePenalidadRequest } from '@/types/penalidad';
import type { Reservation } from '@/types/reservation';

interface PenalidadFormState {
  reservaId: string;
  montoSegunPolitica: string;
  montoAprobado: string;
  montoCondonado: string;
  fechaCancelacion: string;
  motivo: string;
}

const penalidades = ref<Penalidad[]>([]);
const reservations = ref<Reservation[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();
const { loading: isLookingUp, error: lookupError, clearError: clearLookupError, run: runLookup } = useAsyncState();

const lookupReservaId = ref('');
const lookupResults = ref<Penalidad[]>([]);
const isLookupActive = ref(false);

const showModal = ref(false);
const form = ref<PenalidadFormState>({
  reservaId: '', montoSegunPolitica: '', montoAprobado: '',
  montoCondonado: '', fechaCancelacion: '', motivo: '',
});

const showDeleteModal = ref(false);
const penalidadToDelete = ref<Penalidad | null>(null);

const displayedPenalidades = computed<Penalidad[]>(() =>
  isLookupActive.value ? lookupResults.value : penalidades.value
);

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [penalidades.value, reservations.value] = await Promise.all([
      getPenalidades(),
      getReservations(),
    ]);
  });
}

function openModal(): void {
  form.value = {
    reservaId: '', montoSegunPolitica: '', montoAprobado: '',
    montoCondonado: '', fechaCancelacion: '', motivo: '',
  };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.reservaId) return 'Debes seleccionar una reserva.';
  if (!form.value.montoSegunPolitica || Number(form.value.montoSegunPolitica) <= 0)
    return 'El monto según política debe ser mayor a cero.';
  if (form.value.montoAprobado === '' || Number(form.value.montoAprobado) < 0)
    return 'El monto aprobado no puede ser negativo.';
  if (!form.value.fechaCancelacion) return 'La fecha de cancelación es obligatoria.';
  return null;
}

async function handleSubmit(): Promise<void> {
  const err = validate();
  if (err) { modalError.value = err; return; }
  await runSubmit(async () => {
    const condonado = form.value.montoCondonado.trim();
    const payload: CreatePenalidadRequest = {
      reservaId: parseInt(form.value.reservaId, 10),
      montoSegunPolitica: parseFloat(form.value.montoSegunPolitica),
      montoAprobado: parseFloat(form.value.montoAprobado),
      ...(condonado ? { montoCondonado: parseFloat(condonado) } : {}),
      fechaCancelacion: form.value.fechaCancelacion,
      ...(form.value.motivo.trim() ? { motivo: form.value.motivo.trim() } : {}),
    };
    const created = await createPenalidad(payload);
    penalidades.value.push(created);
    closeModal();
  });
}

function confirmDelete(penalidad: Penalidad): void {
  penalidadToDelete.value = penalidad;
  showDeleteModal.value = true;
}

function cancelDelete(): void {
  showDeleteModal.value = false;
  penalidadToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!penalidadToDelete.value) return;
  await runDelete(async () => {
    const deletedId = penalidadToDelete.value!.id;
    await deletePenalidad(deletedId);
    penalidades.value = penalidades.value.filter(p => p.id !== deletedId);
    if (isLookupActive.value) {
      lookupResults.value = lookupResults.value.filter(p => p.id !== deletedId);
    }
    showDeleteModal.value = false;
    penalidadToDelete.value = null;
  });
}

async function handleLookup(): Promise<void> {
  const id = parseInt(lookupReservaId.value, 10);
  if (!lookupReservaId.value || isNaN(id) || id <= 0) {
    lookupError.value = 'Ingresa un ID de reserva válido.';
    return;
  }
  isLookupActive.value = false;
  lookupResults.value = [];
  await runLookup(async () => {
    lookupResults.value = await getPenalidadesByReserva(id);
    isLookupActive.value = true;
  });
}

function clearLookup(): void {
  isLookupActive.value = false;
  lookupResults.value = [];
  lookupReservaId.value = '';
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

onMounted(loadData);
</script>

<style scoped>
.form-optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.75rem;
}
</style>
