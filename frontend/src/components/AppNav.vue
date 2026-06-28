<template>
  <nav class="header-nav">
    <router-link to="/dashboard" class="nav-link" exact-active-class="nav-link--active">Dashboard</router-link>
    <router-link to="/guests" class="nav-link" exact-active-class="nav-link--active">Huéspedes</router-link>
    <router-link to="/properties" class="nav-link" exact-active-class="nav-link--active">Propiedades</router-link>
    <router-link to="/reservations" class="nav-link" exact-active-class="nav-link--active">Reservas</router-link>
    <router-link to="/invoices" class="nav-link" exact-active-class="nav-link--active">Facturas</router-link>
  </nav>
</template>

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
