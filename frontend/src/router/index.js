import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import GuestsView from '../views/GuestsView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import ReservationsView from '../views/ReservationsView.vue';
import InvoicesView from '../views/InvoicesView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import UsuariosView from '../views/UsuariosView.vue';
import CanalesView from '../views/CanalesView.vue';
import TemporadasView from '../views/TemporadasView.vue';
import AppLayout from '../layouts/AppLayout.vue';
import { TOKEN_KEY, ROL_KEY } from '../services/api';

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '/dashboard',     name: 'dashboard',    component: DashboardView },
      { path: '/guests',        name: 'guests',       component: GuestsView },
      { path: '/properties',    name: 'properties',   component: PropertiesView },
      { path: '/reservations',  name: 'reservations', component: ReservationsView },
      { path: '/invoices',      name: 'invoices',     component: InvoicesView },
      { path: '/payments',      name: 'payments',     component: PaymentsView },
      {
        path: '/usuarios',
        name: 'usuarios',
        component: UsuariosView,
        meta: { requiresAdmin: true }
      },
      {
        path: '/canales',
        name: 'canales',
        component: CanalesView,
        meta: { requiresAdmin: true }
      },
      {
        path: '/temporadas',
        name: 'temporadas',
        component: TemporadasView,
        meta: { requiresAdmin: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (to.name !== 'login' && !token) {
    return { name: 'login' };
  }

  if (to.meta.requiresAdmin && localStorage.getItem(ROL_KEY) !== 'Administrador') {
    return { name: 'dashboard' };
  }
});

export default router;
