import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import ReservationsView from '../views/ReservationsView.vue';
import AnticiposView from '../views/AnticiposView.vue';
import PenalidadesView from '../views/PenalidadesView.vue';
import FacturasView from '../views/FacturasView.vue';
import NotasCreditoView from '../views/NotasCreditoView.vue';
import DevolucionesView from '../views/DevolucionesView.vue';
import PoliticasView from '../views/PoliticasView.vue';
import UsuariosView from '../views/UsuariosView.vue';
import CanalesView from '../views/CanalesView.vue';
import TemporadasView from '../views/TemporadasView.vue';
import AppLayout from '../layouts/AppLayout.vue';
import { TOKEN_KEY, ROL_KEY } from '../services/api';

const FINANCIAL_ROLES = ['Administrador', 'Contador', 'Auxiliar contable'];
const BILLING_ROLES   = ['Administrador', 'Contador'];

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
      { path: '/properties',    name: 'properties',   component: PropertiesView },
      { path: '/reservations',  name: 'reservations', component: ReservationsView },
      {
        path: '/anticipos',
        name: 'anticipos',
        component: AnticiposView,
        meta: { requiresFinancial: true }
      },
      {
        path: '/penalidades',
        name: 'penalidades',
        component: PenalidadesView,
        meta: { requiresFinancial: true }
      },
      {
        path: '/facturas',
        name: 'facturas',
        component: FacturasView,
        meta: { requiresBilling: true }
      },
      {
        path: '/notas-credito',
        name: 'notasCredito',
        component: NotasCreditoView,
        meta: { requiresBilling: true }
      },
      {
        path: '/devoluciones',
        name: 'devoluciones',
        component: DevolucionesView,
        meta: { requiresBilling: true }
      },
      { path: '/politicas',     name: 'politicas',    component: PoliticasView },
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
  const rol = localStorage.getItem(ROL_KEY) ?? '';

  if (to.name !== 'login' && !token) {
    return { name: 'login' };
  }

  if (to.meta.requiresAdmin && rol !== 'Administrador') {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresFinancial && !FINANCIAL_ROLES.includes(rol)) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresBilling && !BILLING_ROLES.includes(rol)) {
    return { name: 'dashboard' };
  }
});

export default router;
