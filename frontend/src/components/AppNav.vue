<template>
  <nav class="header-nav">
    <router-link to="/dashboard"    class="nav-link" exact-active-class="nav-link--active">Dashboard</router-link>
    <router-link to="/properties"   class="nav-link" exact-active-class="nav-link--active">Propiedades</router-link>
    <router-link to="/reservations" class="nav-link" exact-active-class="nav-link--active">Reservas</router-link>
    <router-link to="/politicas"    class="nav-link" exact-active-class="nav-link--active">Políticas</router-link>
    <template v-if="esFinanciero">
      <router-link to="/anticipos"   class="nav-link" exact-active-class="nav-link--active">Anticipos</router-link>
      <router-link to="/penalidades" class="nav-link" exact-active-class="nav-link--active">Penalidades</router-link>
    </template>
    <template v-if="esFacturador">
      <router-link to="/facturas"      class="nav-link" exact-active-class="nav-link--active">Facturas</router-link>
      <router-link to="/notas-credito" class="nav-link" exact-active-class="nav-link--active">Notas Crédito</router-link>
      <router-link to="/devoluciones"  class="nav-link" exact-active-class="nav-link--active">Devoluciones</router-link>
    </template>
    <template v-if="esAdministrador">
      <router-link to="/canales"    class="nav-link" exact-active-class="nav-link--active">Canales</router-link>
      <router-link to="/temporadas" class="nav-link" exact-active-class="nav-link--active">Temporadas</router-link>
      <router-link to="/usuarios"   class="nav-link" exact-active-class="nav-link--active">Usuarios</router-link>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { ROL_KEY } from '@/services/api';

const rol = localStorage.getItem(ROL_KEY) ?? '';
const esAdministrador = rol === 'Administrador';
const esFinanciero    = ['Administrador', 'Contador', 'Auxiliar contable'].includes(rol);
const esFacturador    = ['Administrador', 'Contador'].includes(rol);
</script>

<style scoped>
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
</style>
