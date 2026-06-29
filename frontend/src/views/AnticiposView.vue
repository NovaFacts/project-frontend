<template>
  <main class="page-main">
    <PageHeader
      title="Anticipos"
      create-label="Registrar anticipo"
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
      <span>Cargando anticipos…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadData">Reintentar</button>
    </div>

    <div v-else-if="displayedAnticipos.length === 0" class="state-box state-box--empty">
      {{
        isLookupActive
          ? 'No se encontraron anticipos para esa reserva.'
          : 'No hay anticipos registrados.'
      }}
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reserva</th>
            <th>Monto</th>
            <th>Fecha de pago</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Registrado por</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in displayedAnticipos" :key="a.id">
            <td>{{ a.id }}</td>
            <td>#{{ a.reservaId }}</td>
            <td>{{ formatCurrency(a.monto) }}</td>
            <td>{{ formatLocalDate(a.fechaPago) }}</td>
            <td>{{ a.metodoPago ?? '—' }}</td>
            <td>
              <span class="badge" :class="estadoClass(a.estado)">{{ a.estado }}</span>
            </td>
            <td>{{ a.usuarioNombre }}</td>
            <td>{{ formatDate(a.registradoEn) }}</td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--danger" @click="confirmDelete(a)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Registrar anticipo modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">Registrar anticipo</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="ant-reserva">Reserva *</label>
          <select id="ant-reserva" v-model="form.reservaId" required>
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
          <label for="ant-monto">Monto *</label>
          <input
            id="ant-monto"
            v-model="form.monto"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
        <div class="form-group">
          <label for="ant-fecha">Fecha de pago *</label>
          <input id="ant-fecha" v-model="form.fechaPago" type="date" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="ant-metodo">
            Método de pago <span class="form-optional">(opcional)</span>
          </label>
          <input
            id="ant-metodo"
            v-model="form.metodoPago"
            type="text"
            placeholder="transferencia, efectivo, tarjeta…"
            maxlength="80"
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

  <!-- Confirmación de eliminación -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDelete">
    <h3 class="modal-title">Eliminar anticipo</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar el anticipo
      <strong>#{{ anticipoToDelete?.id }}</strong>?
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
  getAnticipos,
  getAnticiposByReserva,
  createAnticipo,
  deleteAnticipo,
} from '@/services/anticipoService';
import { getReservations } from '@/services/reservationService';
import type { Anticipo, CreateAnticipoRequest } from '@/types/anticipo';
import type { Reservation } from '@/types/reservation';

interface AnticipoFormState {
  reservaId: string;
  monto: string;
  fechaPago: string;
  metodoPago: string;
}

const anticipos = ref<Anticipo[]>([]);
const reservations = ref<Reservation[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();
const { loading: isLookingUp, error: lookupError, clearError: clearLookupError, run: runLookup } = useAsyncState();

const lookupReservaId = ref('');
const lookupResults = ref<Anticipo[]>([]);
const isLookupActive = ref(false);

const showModal = ref(false);
const form = ref<AnticipoFormState>({ reservaId: '', monto: '', fechaPago: '', metodoPago: '' });

const showDeleteModal = ref(false);
const anticipoToDelete = ref<Anticipo | null>(null);

const displayedAnticipos = computed<Anticipo[]>(() =>
  isLookupActive.value ? lookupResults.value : anticipos.value
);

function estadoClass(estado: string): string {
  if (estado === 'registrado') return 'badge--pending';
  if (estado === 'aplicado')   return 'badge--paid';
  if (estado === 'devuelto')   return 'badge--cancelled';
  return '';
}

async function loadData(): Promise<void> {
  await runLoad(async () => {
    [anticipos.value, reservations.value] = await Promise.all([
      getAnticipos(),
      getReservations(),
    ]);
  });
}

function openModal(): void {
  form.value = { reservaId: '', monto: '', fechaPago: '', metodoPago: '' };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.reservaId) return 'Debes seleccionar una reserva.';
  if (!form.value.monto || Number(form.value.monto) <= 0) return 'El monto debe ser mayor a cero.';
  if (!form.value.fechaPago) return 'La fecha de pago es obligatoria.';
  return null;
}

async function handleSubmit(): Promise<void> {
  const err = validate();
  if (err) { modalError.value = err; return; }
  await runSubmit(async () => {
    const payload: CreateAnticipoRequest = {
      reservaId: parseInt(form.value.reservaId, 10),
      monto: parseFloat(form.value.monto),
      fechaPago: form.value.fechaPago,
      ...(form.value.metodoPago.trim() ? { metodoPago: form.value.metodoPago.trim() } : {}),
    };
    const created = await createAnticipo(payload);
    anticipos.value.push(created);
    closeModal();
  });
}

function confirmDelete(anticipo: Anticipo): void {
  anticipoToDelete.value = anticipo;
  showDeleteModal.value = true;
}

function cancelDelete(): void {
  showDeleteModal.value = false;
  anticipoToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!anticipoToDelete.value) return;
  await runDelete(async () => {
    const deletedId = anticipoToDelete.value!.id;
    await deleteAnticipo(deletedId);
    anticipos.value = anticipos.value.filter(a => a.id !== deletedId);
    if (isLookupActive.value) {
      lookupResults.value = lookupResults.value.filter(a => a.id !== deletedId);
    }
    showDeleteModal.value = false;
    anticipoToDelete.value = null;
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
    lookupResults.value = await getAnticiposByReserva(id);
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
