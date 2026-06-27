<template>
  <div class="page-container">
    <header class="page-header">
      <img src="@/assets/logo.png" alt="NovaFacts Logo" class="header-logo" />
      <h1 class="header-title">NovaFacts</h1>
      <nav class="header-nav">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/guests" class="nav-link nav-link--active">Huéspedes</router-link>
      </nav>
      <button class="logout-button" @click="handleLogout">Cerrar sesión</button>
    </header>

    <main class="page-main">
      <div class="section-header">
        <h2 class="section-title">Gestión de Huéspedes</h2>
        <button class="btn btn--primary" @click="openCreateModal">+ Nuevo huésped</button>
      </div>

      <div v-if="isLoading" class="state-box">
        <span class="spinner" />
        <span>Cargando huéspedes…</span>
      </div>

      <div v-else-if="errorMessage" class="state-box state-box--error">
        {{ errorMessage }}
        <button class="btn btn--ghost" @click="loadGuests">Reintentar</button>
      </div>

      <div v-else-if="guests.length === 0" class="state-box state-box--empty">
        No hay huéspedes registrados. Crea el primero.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>Tipo doc.</th>
              <th>N° documento</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guest in guests" :key="guest.id">
              <td>{{ guest.firstName }} {{ guest.lastName }}</td>
              <td>{{ guest.documentType }}</td>
              <td>{{ guest.documentNumber }}</td>
              <td>{{ guest.email ?? '—' }}</td>
              <td>{{ guest.phone ?? '—' }}</td>
              <td>{{ formatDate(guest.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn btn--sm btn--ghost" @click="openEditModal(guest)">Editar</button>
                <button class="btn btn--sm btn--danger" @click="confirmDelete(guest)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Create / Edit modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3 class="modal-title">{{ modalMode === 'create' ? 'Nuevo huésped' : 'Editar huésped' }}</h3>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nombre *</label>
              <input id="firstName" v-model="form.firstName" type="text" placeholder="Juan" required />
            </div>
            <div class="form-group">
              <label for="lastName">Apellido *</label>
              <input id="lastName" v-model="form.lastName" type="text" placeholder="Pérez" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="documentType">Tipo de documento *</label>
              <select id="documentType" v-model="form.documentType" required>
                <option value="" disabled>Seleccionar…</option>
                <option v-for="dt in DOCUMENT_TYPES" :key="dt" :value="dt">{{ dt }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="documentNumber">N° de documento *</label>
              <input id="documentNumber" v-model="form.documentNumber" type="text" placeholder="1234567890" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Correo electrónico</label>
              <input id="email" v-model="form.email" type="email" placeholder="juan@correo.com" />
            </div>
            <div class="form-group">
              <label for="phone">Teléfono</label>
              <input id="phone" v-model="form.phone" type="tel" placeholder="3001234567" />
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
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="cancelDelete">
      <div class="modal modal--sm">
        <h3 class="modal-title">Eliminar huésped</h3>
        <p class="modal-body">
          ¿Estás seguro de que quieres eliminar a
          <strong>{{ guestToDelete?.firstName }} {{ guestToDelete?.lastName }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
        <div class="modal-actions">
          <button class="btn btn--ghost" @click="cancelDelete">Cancelar</button>
          <button class="btn btn--danger" :disabled="isDeleting" @click="handleDelete">
            {{ isDeleting ? 'Eliminando…' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { logout } from '@/services/authService';
import { getGuests, createGuest, updateGuest, deleteGuest } from '@/services/guestService';
import type { Guest, CreateGuestRequest, UpdateGuestRequest } from '@/types/guest';

const DOCUMENT_TYPES = ['CC', 'CE', 'PA', 'NIT', 'TI'];

const router = useRouter();
const guests = ref<Guest[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedGuest = ref<Guest | null>(null);
const isSubmitting = ref(false);
const modalError = ref('');

const showDeleteModal = ref(false);
const guestToDelete = ref<Guest | null>(null);
const isDeleting = ref(false);
const deleteError = ref('');

const emptyForm = (): CreateGuestRequest => ({
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  email: '',
  phone: '',
});

const form = ref<CreateGuestRequest>(emptyForm());

async function loadGuests() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    guests.value = await getGuests();
  } catch {
    errorMessage.value = 'No se pudo cargar la lista de huéspedes. Verifica tu conexión.';
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  modalMode.value = 'create';
  selectedGuest.value = null;
  form.value = emptyForm();
  modalError.value = '';
  showModal.value = true;
}

function openEditModal(guest: Guest) {
  modalMode.value = 'edit';
  selectedGuest.value = guest;
  form.value = {
    firstName: guest.firstName,
    lastName: guest.lastName,
    documentType: guest.documentType,
    documentNumber: guest.documentNumber,
    email: guest.email ?? '',
    phone: guest.phone ?? '',
  };
  modalError.value = '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function handleSubmit() {
  if (!form.value.firstName || !form.value.lastName || !form.value.documentType || !form.value.documentNumber) {
    modalError.value = 'Los campos marcados con * son obligatorios.';
    return;
  }

  isSubmitting.value = true;
  modalError.value = '';
  const payload: CreateGuestRequest = {
    ...form.value,
    email: form.value.email || null,
    phone: form.value.phone || null,
  };
  try {
    if (modalMode.value === 'create') {
      const created = await createGuest(payload);
      guests.value.push(created);
    } else if (selectedGuest.value) {
      const updated = await updateGuest(selectedGuest.value.id, payload as UpdateGuestRequest);
      const index = guests.value.findIndex(g => g.id === updated.id);
      if (index !== -1) guests.value[index] = updated;
    }
    showModal.value = false;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      modalError.value = err.response?.data?.error ?? 'Error al guardar el huésped.';
    } else {
      modalError.value = 'Error al guardar el huésped.';
    }
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete(guest: Guest) {
  guestToDelete.value = guest;
  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;
  guestToDelete.value = null;
  deleteError.value = '';
}

async function handleDelete() {
  if (!guestToDelete.value) return;
  isDeleting.value = true;
  deleteError.value = '';
  try {
    await deleteGuest(guestToDelete.value.id);
    guests.value = guests.value.filter(g => g.id !== guestToDelete.value!.id);
    showDeleteModal.value = false;
    guestToDelete.value = null;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      deleteError.value = err.response?.data?.error ?? 'No se pudo eliminar el huésped.';
    } else {
      deleteError.value = 'No se pudo eliminar el huésped.';
    }
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function handleLogout(): void {
  logout();
  router.push('/');
}

onMounted(loadGuests);
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc;
}

/* ── Header ─────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.header-logo {
  width: 36px;
  height: auto;
}

.header-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 8px;
  margin-left: 24px;
  flex: 1;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #475569;
  text-decoration: none;
  transition: background-color 0.15s;
}

.nav-link:hover {
  background-color: #f1f5f9;
  color: #111111;
}

.nav-link--active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.logout-button {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #f1f5f9;
}

/* ── Main ────────────────────────────────────────────────── */
.page-main {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

/* ── State boxes ─────────────────────────────────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  color: #64748b;
  font-size: 0.95rem;
}

.state-box--error {
  color: #b91c1c;
}

.state-box--empty {
  color: #94a3b8;
}

.spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Table ───────────────────────────────────────────────── */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 14px 16px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background-color: #f8fafc;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

/* ── Buttons ─────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn--ghost {
  background: none;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn--ghost:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.btn--danger {
  background-color: #dc2626;
  color: #ffffff;
}

.btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.btn--sm {
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 6px;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal--sm {
  max-width: 420px;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111111;
  margin: 0 0 24px;
}

.modal-body {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 24px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

/* ── Form ────────────────────────────────────────────────── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  background-color: #ffffff;
  outline: none;
  transition: border-color 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-error {
  color: #dc2626;
  font-size: 0.82rem;
  margin: 8px 0 0;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal {
    padding: 24px 16px;
  }
}
</style>
