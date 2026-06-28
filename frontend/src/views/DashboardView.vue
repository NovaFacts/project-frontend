<template>
  <main class="dashboard-main">
    <h2 class="welcome-title">Bienvenido al panel de gestión</h2>
    <p class="welcome-subtitle">
      Gestión financiera de reservas de hospedaje — próximamente.
    </p>
  </main>
</template>

<style scoped>
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
