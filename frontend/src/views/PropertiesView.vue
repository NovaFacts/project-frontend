<template>
  <main class="page-main">
    <PageHeader
      title="Gestión de Propiedades"
      create-label="+ Nueva propiedad"
      :show-create-button="true"
      @create="openCreateModal"
    />

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando propiedades…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost" @click="loadProperties">Reintentar</button>
    </div>

    <div v-else-if="properties.length === 0" class="state-box state-box--empty">
      No hay propiedades registradas. Crea la primera.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Ciudad</th>
            <th>Dirección</th>
            <th>Capacidad</th>
            <th>Precio / noche</th>
            <th>Registrada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="property in properties" :key="property.id">
            <td>{{ property.name }}</td>
            <td>{{ property.city }}</td>
            <td>{{ property.address }}</td>
            <td>{{ property.capacity }} pers.</td>
            <td>{{ formatCurrency(property.pricePerNight) }}</td>
            <td>{{ formatDate(property.createdAt) }}</td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--ghost" @click="openEditModal(property)">Editar</button>
              <button class="btn btn--sm btn--danger" @click="confirmDelete(property)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Create / Edit modal -->
  <AppModal v-if="showModal" @close="closeModal">
    <h3 class="modal-title">{{ modalMode === 'create' ? 'Nueva propiedad' : 'Editar propiedad' }}</h3>

    <form @submit.prevent="handleSubmit" novalidate>
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="prop-name">Nombre *</label>
          <input
            id="prop-name"
            v-model="form.name"
            type="text"
            placeholder="Casa de playa"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="prop-city">Ciudad *</label>
          <input
            id="prop-city"
            v-model="form.city"
            type="text"
            placeholder="Cartagena"
            required
          />
        </div>
        <div class="form-group">
          <label for="prop-capacity">Capacidad (personas) *</label>
          <input
            id="prop-capacity"
            v-model="form.capacity"
            type="number"
            min="1"
            step="1"
            placeholder="4"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="prop-address">Dirección *</label>
          <input
            id="prop-address"
            v-model="form.address"
            type="text"
            placeholder="Calle 1 # 2-3"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="prop-price">Precio por noche (COP) *</label>
          <input
            id="prop-price"
            v-model="form.pricePerNight"
            type="number"
            min="0"
            step="1000"
            placeholder="150000"
            required
          />
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
    <h3 class="modal-title">Eliminar propiedad</h3>
    <p class="modal-body">
      ¿Estás seguro de que quieres eliminar
      <strong>{{ propertyToDelete?.name }}</strong>?
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
import { ref, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import AppModal from '@/components/AppModal.vue';
import PageHeader from '@/components/PageHeader.vue';
import { getProperties, createProperty, updateProperty, deleteProperty } from '@/services/propertyService';
import type { Property, CreatePropertyRequest } from '@/types/property';

interface PropertyFormState {
  name: string;
  address: string;
  city: string;
  capacity: string;
  pricePerNight: string;
}

const properties = ref<Property[]>([]);

const { loading: isLoading, error: errorMessage, run: runLoad } = useAsyncState();
const { loading: isSubmitting, error: modalError, run: runSubmit } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();

const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedProperty = ref<Property | null>(null);

const showDeleteModal = ref(false);
const propertyToDelete = ref<Property | null>(null);

const emptyForm = (): PropertyFormState => ({
  name: '',
  address: '',
  city: '',
  capacity: '',
  pricePerNight: '',
});

const form = ref<PropertyFormState>(emptyForm());

async function loadProperties(): Promise<void> {
  await runLoad(async () => {
    properties.value = await getProperties();
  });
}

function openCreateModal(): void {
  modalMode.value = 'create';
  selectedProperty.value = null;
  form.value = emptyForm();
  showModal.value = true;
}

function openEditModal(property: Property): void {
  modalMode.value = 'edit';
  selectedProperty.value = property;
  form.value = {
    name: property.name,
    address: property.address,
    city: property.city,
    capacity: String(property.capacity),
    pricePerNight: String(property.pricePerNight),
  };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

function validate(): string | null {
  if (!form.value.name.trim()) return 'El nombre es obligatorio.';
  if (!form.value.city.trim()) return 'La ciudad es obligatoria.';
  if (!form.value.address.trim()) return 'La dirección es obligatoria.';
  const cap = parseInt(form.value.capacity, 10);
  if (!form.value.capacity || isNaN(cap) || cap <= 0) {
    return 'La capacidad debe ser un número entero mayor a 0.';
  }
  const price = parseFloat(form.value.pricePerNight);
  if (!form.value.pricePerNight || isNaN(price) || price <= 0) {
    return 'El precio por noche debe ser mayor a 0.';
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
    const payload: CreatePropertyRequest = {
      name: form.value.name.trim(),
      address: form.value.address.trim(),
      city: form.value.city.trim(),
      capacity: parseInt(form.value.capacity, 10),
      pricePerNight: parseFloat(form.value.pricePerNight),
    };
    if (modalMode.value === 'create') {
      const created = await createProperty(payload);
      properties.value.push(created);
    } else if (selectedProperty.value) {
      const updated = await updateProperty(selectedProperty.value.id, payload);
      const index = properties.value.findIndex(p => p.id === updated.id);
      if (index !== -1) properties.value[index] = updated;
    }
    closeModal();
  });
}

function confirmDelete(property: Property): void {
  propertyToDelete.value = property;
  showDeleteModal.value = true;
}

function cancelDelete(): void {
  showDeleteModal.value = false;
  propertyToDelete.value = null;
}

async function handleDelete(): Promise<void> {
  if (!propertyToDelete.value) return;
  await runDelete(async () => {
    await deleteProperty(propertyToDelete.value!.id);
    properties.value = properties.value.filter(p => p.id !== propertyToDelete.value!.id);
    showDeleteModal.value = false;
    propertyToDelete.value = null;
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

onMounted(loadProperties);
</script>
