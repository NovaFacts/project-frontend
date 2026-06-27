<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <img src="@/assets/logo.png" alt="NovaFacts Logo" class="header-logo" />
      <h1 class="header-title">NovaFacts</h1>
      <button class="logout-button" @click="handleLogout">Cerrar sesión</button>
    </header>

    <main class="dashboard-main">
      <h2 class="welcome-title">Bienvenido al panel de gestión</h2>
      <p class="welcome-subtitle">
        Gestión financiera de reservas de hospedaje — próximamente.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function handleLogout(): void {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  router.push('/');
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc;
}

.dashboard-header {
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
  flex: 1;
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

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.welcome-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}
</style>
