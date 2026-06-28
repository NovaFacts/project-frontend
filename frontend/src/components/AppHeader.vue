<template>
  <header class="app-header">
    <img src="@/assets/logo.png" alt="NovaFacts Logo" class="header-logo" />
    <h1 class="header-title">NovaFacts</h1>
    <AppNav />
    <button class="logout-button" @click="handleLogout">Cerrar sesión</button>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { logout } from '@/services/authService';
import AppNav from '@/components/AppNav.vue';

const router = useRouter();

function handleLogout(): void {
  logout();
  router.push('/');
}
</script>

<style scoped>
.app-header {
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
</style>
