<template>
  <main class="page-main">
    <div class="section-header">
      <h2 class="section-title">Políticas de cancelación</h2>
      <button v-if="esAdministrador" class="btn btn--primary" @click="abrirModalCrear">+ Nueva política</button>
    </div>

    <!-- Property filter -->
    <div class="filter-row">
      <label for="filter-propiedad" class="filter-label">Filtrar por propiedad:</label>
      <select id="filter-propiedad" v-model="propiedadFiltro" class="filter-select" @change="filtrarPoliticas">
        <option value="">Todas las propiedades</option>
        <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando políticas…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost btn--sm" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="politicasFiltradas.length === 0" class="state-box state-box--empty">
      No hay políticas registradas{{ propiedadFiltro ? ' para esta propiedad' : '' }}.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Nombre</th>
            <th>% Reembolso</th>
            <th>Días aviso</th>
            <th v-if="esAdministrador">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in politicasFiltradas" :key="p.id">
            <td>{{ p.propiedadNombre }}</td>
            <td>
              <span>{{ p.nombre }}</span>
              <span v-if="p.descripcion" class="text-muted block-text">{{ p.descripcion }}</span>
            </td>
            <td>{{ p.porcentajeReembolso }}%</td>
            <td>{{ p.diasAviso }} día{{ p.diasAviso !== 1 ? 's' : '' }}</td>
            <td v-if="esAdministrador" class="actions-cell">
              <button class="btn btn--sm btn--ghost" @click="abrirModalEditar(p)">Editar</button>
              <button class="btn btn--sm btn--danger" @click="confirmarEliminar(p)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Create / Edit modal -->
  <AppModal v-if="modalVisible" @close="cerrarModal">
    <h3 class="modal-title">{{ editandoId ? 'Editar política' : 'Nueva política' }}</h3>
    <div v-if="formError" class="page-error">{{ formError }}</div>

    <form @submit.prevent="guardar">
      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pol-propiedad">Propiedad *</label>
          <select id="pol-propiedad" v-model="form.propiedadId" required>
            <option value="" disabled>Selecciona una propiedad</option>
            <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pol-nombre">Nombre *</label>
          <input id="pol-nombre" v-model="form.nombre" type="text" required maxlength="150"
                 placeholder="Ej: Cancelación flexible" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label for="pol-desc">Descripción</label>
          <textarea id="pol-desc" v-model="form.descripcion" rows="2"
                    placeholder="Detalles adicionales de la política…" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="pol-pct">% Reembolso *</label>
          <input id="pol-pct" v-model="form.porcentajeReembolso" type="number"
                 min="0" max="100" step="0.01" required placeholder="100" />
        </div>
        <div class="form-group">
          <label for="pol-dias">Días de aviso *</label>
          <input id="pol-dias" v-model="form.diasAviso" type="number"
                 min="0" step="1" required placeholder="7" />
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
    <h3 class="modal-title">Eliminar política</h3>
    <p class="modal-body">
      ¿Eliminar la política <strong>{{ politicaAEliminar?.nombre }}</strong>?
      Esta acción no se puede deshacer.
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
import { ref, computed, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import AppModal from '@/components/AppModal.vue';
import { ROL_KEY } from '@/services/api';
import { getProperties } from '@/services/propertyService';
import { getPoliticas, createPolitica, updatePolitica, deletePolitica } from '@/services/politicaCancelacionService';
import type { Property } from '@/types/property';
import type { PoliticaCancelacion, PoliticaCancelacionRequest } from '@/types/politicaCancelacion';

const esAdministrador = localStorage.getItem(ROL_KEY) === 'Administrador';

const politicas = ref<PoliticaCancelacion[]>([]);
const properties = ref<Property[]>([]);
const propiedadFiltro = ref<number | ''>('');

const modalVisible = ref(false);
const modalEliminarVisible = ref(false);
const editandoId = ref<number | null>(null);
const isSaving = ref(false);
const formError = ref<string | null>(null);
const politicaAEliminar = ref<PoliticaCancelacion | null>(null);

const form = ref<PoliticaCancelacionRequest>({
  propiedadId: 0,
  nombre: '',
  descripcion: '',
  porcentajeReembolso: 100,
  diasAviso: 0,
});

const { loading: isLoading, error: errorMessage, run } = useAsyncState();
const { loading: isDeleting, error: deleteError, run: runDelete } = useAsyncState();

const politicasFiltradas = computed(() => {
  if (!propiedadFiltro.value) return politicas.value;
  return politicas.value.filter(p => p.propiedadId === propiedadFiltro.value);
});

async function cargar(): Promise<void> {
  await run(async () => {
    [politicas.value, properties.value] = await Promise.all([
      getPoliticas(),
      getProperties(),
    ]);
    // Only active properties available for selection
    properties.value = properties.value.filter(p => p.activa);
  });
}

function filtrarPoliticas(): void {
  // Reactive filtering handled by computed
}

function abrirModalCrear(): void {
  editandoId.value = null;
  form.value = { propiedadId: 0, nombre: '', descripcion: '', porcentajeReembolso: 100, diasAviso: 0 };
  formError.value = null;
  modalVisible.value = true;
}

function abrirModalEditar(p: PoliticaCancelacion): void {
  editandoId.value = p.id;
  form.value = {
    propiedadId: p.propiedadId,
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    porcentajeReembolso: p.porcentajeReembolso,
    diasAviso: p.diasAviso,
  };
  formError.value = null;
  modalVisible.value = true;
}

function cerrarModal(): void {
  modalVisible.value = false;
}

async function guardar(): Promise<void> {
  if (!form.value.propiedadId) {
    formError.value = 'La propiedad es obligatoria.';
    return;
  }
  formError.value = null;
  isSaving.value = true;
  try {
    const payload: PoliticaCancelacionRequest = {
      propiedadId: Number(form.value.propiedadId),
      nombre: form.value.nombre,
      descripcion: form.value.descripcion || undefined,
      porcentajeReembolso: Number(form.value.porcentajeReembolso),
      diasAviso: Number(form.value.diasAviso),
    };
    if (editandoId.value === null) {
      const nueva = await createPolitica(payload);
      politicas.value.push(nueva);
    } else {
      const actualizada = await updatePolitica(editandoId.value, payload);
      const idx = politicas.value.findIndex(p => p.id === editandoId.value);
      if (idx !== -1) politicas.value[idx] = actualizada;
    }
    cerrarModal();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    formError.value = e.response?.data?.error ?? 'Error al guardar la política.';
  } finally {
    isSaving.value = false;
  }
}

function confirmarEliminar(p: PoliticaCancelacion): void {
  politicaAEliminar.value = p;
  modalEliminarVisible.value = true;
}

function cancelarEliminar(): void {
  modalEliminarVisible.value = false;
  politicaAEliminar.value = null;
}

async function handleEliminar(): Promise<void> {
  if (!politicaAEliminar.value) return;
  await runDelete(async () => {
    await deletePolitica(politicaAEliminar.value!.id);
    politicas.value = politicas.value.filter(p => p.id !== politicaAEliminar.value!.id);
    cancelarEliminar();
  });
}

onMounted(cargar);
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.filter-select {
  max-width: 320px;
  flex: 1;
}

.text-muted {
  font-size: 0.8rem;
  color: #94a3b8;
}

.block-text {
  display: block;
  margin-top: 2px;
}
</style>
