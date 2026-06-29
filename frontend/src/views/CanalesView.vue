<template>
  <main class="page-main">
    <div class="section-header">
      <h2 class="section-title">Canales de reserva</h2>
    </div>

    <div v-if="isLoading" class="state-box">
      <span class="spinner" />
      <span>Cargando canales…</span>
    </div>

    <div v-else-if="errorMessage" class="state-box state-box--error">
      {{ errorMessage }}
      <button class="btn btn--ghost btn--sm" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="canales.length === 0" class="state-box state-box--empty">
      No hay canales registrados.
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="canal in canales" :key="canal.id">
            <td>{{ canal.id }}</td>
            <td>{{ canal.nombre }}</td>
            <td>
              <span :class="canal.tipo === 'Plataforma' ? 'badge badge--confirmed' : 'badge badge--pending'">
                {{ canal.tipo }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAsyncState } from '@/composables/useAsyncState';
import { getCanales } from '@/services/canalService';
import type { Canal } from '@/types/canal';

const canales = ref<Canal[]>([]);
const { loading: isLoading, error: errorMessage, run } = useAsyncState();

async function cargar(): Promise<void> {
  await run(async () => {
    canales.value = await getCanales();
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
