import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import GuestsView from '../views/GuestsView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import ReservationsView from '../views/ReservationsView.vue';
import InvoicesView from '../views/InvoicesView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import AppLayout from '../layouts/AppLayout.vue';
import { TOKEN_KEY } from '../services/api';

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
      { path: '/dashboard', name: 'dashboard', component: DashboardView },
      { path: '/guests', name: 'guests', component: GuestsView },
      { path: '/properties', name: 'properties', component: PropertiesView },
      { path: '/reservations', name: 'reservations', component: ReservationsView },
      { path: '/invoices', name: 'invoices', component: InvoicesView },
      { path: '/payments', name: 'payments', component: PaymentsView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  if (to.name !== 'login' && !localStorage.getItem(TOKEN_KEY)) {
    return { name: 'login' };
  }
});

export default router;
