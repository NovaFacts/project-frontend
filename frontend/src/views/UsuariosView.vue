<template>
  <main class="page-main">
    <div class="section-header">
      <h2 class="section-title">Gestión de usuarios</h2>
      <button class="btn btn--primary" @click="abrirModalCrear">+ Nuevo usuario</button>
    </div>

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando usuarios…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost btn--sm" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="usuarios.length === 0" class="state-box state-box--empty">
      No hay usuarios registrados.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.rol.nombre }}</td>
            <td>
              <span :class="u.activo !== false ? 'badge badge--confirmed' : 'badge badge--cancelled'">
                {{ u.activo !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button
                v-if="u.activo !== false"
                class="btn btn--ghost btn--sm btn--danger"
                :disabled="desactivandoId === u.id"
                @click="desactivar(u)"
              >
                {{ desactivandoId === u.id ? 'Desactivando…' : 'Desactivar' }}
              </button>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Nuevo usuario -->
    <AppModal v-if="modalVisible" @close="cerrarModal">
      <h3 class="modal-title">Nuevo usuario</h3>

      <div v-if="formError" class="page-error">{{ formError }}</div>

      <form @submit.prevent="guardar">
        <div class="form-row">
          <div class="form-group form-group--full">
            <label for="nombre">Nombre completo</label>
            <input id="nombre" v-model="form.nombre" type="text" required placeholder="Ej: María García" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model="form.email" type="email" required placeholder="usuario@empresa.com" />
          </div>
          <div class="form-group">
            <label for="password">Contraseña temporal</label>
            <input id="password" v-model="form.password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-group--full">
            <label for="rol">Rol</label>
            <select id="rol" v-model="form.rolId" required>
              <option value="" disabled>Selecciona un rol…</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn--ghost" @click="cerrarModal">Cancelar</button>
          <button type="submit" class="btn btn--primary" :disabled="isSaving">
            {{ isSaving ? 'Guardando…' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </AppModal>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import { getUsuarios, createUsuario, deleteUsuario } from '@/services/userService';
import { getRoles } from '@/services/rolService';
import type { RolResponse } from '@/types/rol';
import AppModal from '@/components/AppModal.vue';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  activo?: boolean;
  rol: { id: number; nombre: string; descripcion: string | null };
}

const usuarios = ref<Usuario[]>([]);
const roles = ref<RolResponse[]>([]);
const modalVisible = ref(false);
const isSaving = ref(false);
const formError = ref<string | null>(null);
const desactivandoId = ref<number | null>(null);

const form = ref({ nombre: '', email: '', password: '', rolId: '' as number | '' });

const { loading: isLoading, error: errorMessage, run } = useAsyncState();

async function cargar(): Promise<void> {
  await run(async () => {
    const [listaUsuarios, listaRoles] = await Promise.all([getUsuarios(), getRoles()]);
    usuarios.value = listaUsuarios;
    roles.value = listaRoles;
  });
}

function abrirModalCrear(): void {
  form.value = { nombre: '', email: '', password: '', rolId: '' };
  formError.value = null;
  modalVisible.value = true;
}

function cerrarModal(): void {
  modalVisible.value = false;
}

async function desactivar(u: Usuario): Promise<void> {
  if (!confirm(`¿Desactivar al usuario "${u.nombre}"? No podrá iniciar sesión.`)) return;
  desactivandoId.value = u.id;
  try {
    await deleteUsuario(u.id);
    u.activo = false;
  } catch {
    alert('No se pudo desactivar el usuario. Intente nuevamente.');
  } finally {
    desactivandoId.value = null;
  }
}

async function guardar(): Promise<void> {
  if (!form.value.rolId) return;

  isSaving.value = true;
  formError.value = null;

  try {
    const nuevo = await createUsuario({
      nombre: form.value.nombre,
      email: form.value.email,
      password: form.value.password,
      rolId: form.value.rolId as number,
    });
    usuarios.value.push(nuevo);
    cerrarModal();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    formError.value = e.response?.data?.error ?? 'Error al crear el usuario.';
  } finally {
    isSaving.value = false;
  }
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

.btn--danger {
  color: #dc2626;
  border-color: #fca5a5;
}

.btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #dc2626;
}

.text-muted {
  color: #9ca3af;
}
</style>
