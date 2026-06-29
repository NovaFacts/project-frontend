<template>
  <main class="page-main">
    <div class="section-header">
      <h2 class="section-title">Temporadas</h2>
      <button class="btn btn--primary" @click="abrirModalCrear">+ Nueva temporada</button>
    </div>

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando temporadas…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost btn--sm" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="temporadas.length === 0" class="state-box state-box--empty">
      No hay temporadas registradas. Crea la primera.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in temporadas" :key="t.id">
            <td>{{ t.nombre }}</td>
            <td>{{ formatDate(t.fechaInicio) }}</td>
            <td>{{ formatDate(t.fechaFin) }}</td>
            <td class="actions-cell">
              <button class="btn btn--sm btn--ghost" @click="abrirModalEditar(t)">Editar</button>
              <button class="btn btn--sm btn--danger" @click="confirmarEliminar(t)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Create / Edit modal -->
  <AppModal v-if="modalVisible" @close="cerrarModal">
    <h3 class="modal-title">{{ editandoId ? 'Editar temporada' : 'Nueva temporada' }}</h3>

    <div v-if="formError" class="page-error">{{ formError }}</div>

    <form @submit.prevent="guardar">
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="temp-nombre">Nombre *</label>
          <input id="temp-nombre" v-model="form.nombre" type="text" required placeholder="Ej: Temporada alta 2027" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="temp-inicio">Fecha inicio *</label>
          <input id="temp-inicio" v-model="form.fechaInicio" type="date" required />
        </div>
        <div class="form-group">
          <label for="temp-fin">Fecha fin *</label>
          <input id="temp-fin" v-model="form.fechaFin" type="date" required />
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn--ghost" @click="cerrarModal">Cancelar</button>
        <button type="submit" class="btn btn--primary" :disabled="isSaving">
          {{ isSaving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>
  </AppModal>

  <!-- Delete confirmation modal -->
  <AppModal v-if="modalEliminarVisible" size="sm" @close="cancelarEliminar">
    <h3 class="modal-title">Eliminar temporada</h3>
    <p class="modal-body">
      ¿Eliminar <strong>{{ temporadaAEliminar?.nombre }}</strong>? Esta acción no se puede deshacer.
    </p>
    <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
    <div class="modal-actions">
      <button class="btn btn--ghost" @click="cancelarEliminar">Cancelar</button>
      <button class="btn btn--danger" :disabled="isDeleting" @click="handleEliminar">
        {{ isDeleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import { getTemporadas, createTemporada, updateTemporada, deleteTemporada } from '@/services/temporadaService';
import type { Temporada } from '@/types/temporada';
import AppModal from '@/components/AppModal.vue';

const temporadas = ref<Temporada[]>([]);
const modalVisible = ref(false);
const modalEliminarVisible = ref(false);
const editandoId = ref<number | null>(null);
const isSaving = ref(false);
const formError = ref<string | null>(null);
const temporadaAEliminar = ref<Temporada | null>(null);

const form = ref({ nombre: '', fechaInicio: '', fechaFin: '' });

const { loading: isLoading, error: errorMessage, run } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();

async function cargar(): Promise<void> {
  await run(async () => {
    temporadas.value = await getTemporadas();
  });
}

function abrirModalCrear(): void {
  editandoId.value = null;
  form.value = { nombre: '', fechaInicio: '', fechaFin: '' };
  formError.value = null;
  modalVisible.value = true;
}

function abrirModalEditar(t: Temporada): void {
  editandoId.value = t.id;
  form.value = { nombre: t.nombre, fechaInicio: t.fechaInicio, fechaFin: t.fechaFin };
  formError.value = null;
  modalVisible.value = true;
}

function cerrarModal(): void {
  modalVisible.value = false;
}

async function guardar(): Promise<void> {
  formError.value = null;
  isSaving.value = true;
  try {
    if (editandoId.value === null) {
      const nueva = await createTemporada(form.value);
      temporadas.value.push(nueva);
    } else {
      const actualizada = await updateTemporada(editandoId.value, form.value);
      const idx = temporadas.value.findIndex(t => t.id === editandoId.value);
      if (idx !== -1) temporadas.value[idx] = actualizada;
    }
    cerrarModal();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    formError.value = e.response?.data?.error ?? 'Error al guardar la temporada.';
  } finally {
    isSaving.value = false;
  }
}

function confirmarEliminar(t: Temporada): void {
  temporadaAEliminar.value = t;
  modalEliminarVisible.value = true;
}

function cancelarEliminar(): void {
  modalEliminarVisible.value = false;
  temporadaAEliminar.value = null;
}

async function handleEliminar(): Promise<void> {
  if (!temporadaAEliminar.value) return;
  await runDelete(async () => {
    await deleteTemporada(temporadaAEliminar.value!.id);
    temporadas.value = temporadas.value.filter(t => t.id !== temporadaAEliminar.value!.id);
    cancelarEliminar();
  });
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(cargar);
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}
</style>
