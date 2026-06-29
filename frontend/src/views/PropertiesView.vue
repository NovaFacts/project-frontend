<template>
  <main class="page-main">
    <PageHeader
      title="Gestión de propiedades"
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
            <th>Dirección</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="property in properties" :key="property.id">
            <td>{{ property.name }}</td>
            <td>{{ property.address ?? '—' }}</td>
            <td>{{ property.descripcion ?? '—' }}</td>
            <td>
              <span :class="property.activa ? 'badge badge--confirmed' : 'badge badge--cancelled'">
                {{ property.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--ghost" @click="openEditModal(property)">Editar</button>
              <button
                v-if="property.activa"
                class="btn btn--sm btn--danger"
                @click="confirmDelete(property)"
              >
                Desactivar
              </button>
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
          <input id="prop-name" v-model="form.name" type="text" placeholder="Casa de playa" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="prop-address">Dirección</label>
          <input id="prop-address" v-model="form.address" type="text" placeholder="Calle 1 # 2-3" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="prop-descripcion">Descripción</label>
          <textarea id="prop-descripcion" v-model="form.descripcion" rows="3" placeholder="Descripción opcional de la propiedad…" />
        </div>
      </div>

      <div v-if="modalMode === 'edit'" class="form-row">
        <div class="form-group form-group--full">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.activa" />
            Propiedad activa
          </label>
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

  <!-- Deactivate confirmation modal -->
  <AppModal v-if="showDeleteModal" size="sm" @close="cancelDelete">
    <h3 class="modal-title">Desactivar propiedad</h3>
    <p class="modal-body">
      ¿Desactivar <strong>{{ propertyToDelete?.name }}</strong>?
      La propiedad permanecerá en el sistema marcada como inactiva.
    </p>
    <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
    <div class="modal-actions">
      <button class="btn btn--ghost" @click="cancelDelete">Cancelar</button>
      <button class="btn btn--danger" :disabled="isDeleting" @click="handleDelete">
        {{ isDeleting ? 'Desactivando…' : 'Desactivar' }}
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
import type { Property, UpdatePropertyRequest } from '@/types/property';

interface PropertyFormState {
  name: string;
  address: string;
  descripcion: string;
  activa: boolean;
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
  descripcion: '',
  activa: true,
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
    address: property.address ?? '',
    descripcion: property.descripcion ?? '',
    activa: property.activa,
  };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
}

async function handleSubmit(): Promise<void> {
  if (!form.value.name.trim()) {
    modalError.value = 'El nombre es obligatorio.';
    return;
  }
  await runSubmit(async () => {
    if (modalMode.value === 'create') {
      const created = await createProperty({
        name: form.value.name.trim(),
        address: form.value.address.trim() || undefined,
        descripcion: form.value.descripcion.trim() || undefined,
      });
      properties.value.push(created);
    } else if (selectedProperty.value) {
      const payload: UpdatePropertyRequest = {
        name: form.value.name.trim(),
        address: form.value.address.trim() || undefined,
        descripcion: form.value.descripcion.trim() || undefined,
        activa: form.value.activa,
      };
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
    const index = properties.value.findIndex(p => p.id === propertyToDelete.value!.id);
    if (index !== -1) properties.value[index] = { ...properties.value[index], activa: false };
    showDeleteModal.value = false;
    propertyToDelete.value = null;
  });
}

onMounted(loadProperties);
</script>

<style scoped>
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
