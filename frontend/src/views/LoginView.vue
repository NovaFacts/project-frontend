<template>
  <div class="login-container">
    <div class="login-card">

      <div class="brand-section">
        <div class="logo-wrapper">
          <img src="@/assets/logo.png" alt="NovaFacts Logo" class="brand-logo" />
          <h1 class="brand-name">NovaFacts</h1>
        </div>
        <p class="brand-tagline">
          Gestión financiera inteligente para tus reservas de hospedaje
        </p>
      </div>

      <div class="divider"></div>

      <div class="form-section">
        <h2 class="form-title">Iniciar Sesión</h2>
        <p class="form-subtitle">
          Accede a tu cuenta y descubre la manera más sencilla de administrar reservas, huéspedes y servicios.
        </p>

        <div v-if="errorMessage" class="error-banner" role="alert">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleFormSubmit" class="auth-form">

          <div class="input-group">
            <label for="email" class="input-label">Correo electrónico</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input
                id="email"
                v-model="userEmail"
                type="email"
                placeholder="usuario@novafacts.com"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="input-group">
            <label for="password" class="input-label">Contraseña</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <input
                id="password"
                v-model="userPassword"
                type="password"
                placeholder="••••••••"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="shouldRememberSession" class="checkbox" />
              <span>Recordarme</span>
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" :disabled="isSubmitting" class="submit-button">
            {{ isSubmitting ? 'Cargando...' : 'Iniciar Sesión' }}
          </button>

        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authenticateUser } from '@/services/authService';
import type { LoginCredentials } from '@/types/auth';

const router = useRouter();

// Variables descriptivas y reactivas con tipado explícito de TypeScript
const userEmail = ref<string>('');
const userPassword = ref<string>('');
const shouldRememberSession = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

/**
 * Controlador principal del envío del formulario.
 * Su única tarea es coordinar el estado de la vista y delegar la lógica pesada.
 */
async function handleFormSubmit(): Promise<void> {
  // Evitar peticiones duplicadas (Retorno anticipado rápido)
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = null;

  // Creamos el objeto de parámetros estructurado basado en la interfaz
  const credentials: LoginCredentials = {
    email: userEmail.value,
    password: userPassword.value,
    shouldRememberUser: shouldRememberSession.value
  };

  // Consumo del servicio aplicando desestructuración y uniones discriminadas
  const result = await authenticateUser(credentials);
  isSubmitting.value = false;

  if (result.status === 'invalid_credentials') {
    errorMessage.value = result.message;
    return;
  }

  if (result.status === 'server_error') {
    errorMessage.value = `Error en el servidor (${result.errorCode}). Por favor, intente más tarde.`;
    return;
  }

  // Si todo sale bien (status === 'success')
  router.push('/dashboard');
}
</script>

<style scoped>
/* Contenedor Principal e Imagen de Fondo */
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('@/assets/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

/* Tarjeta de Login */
.login-card {
  background-color: rgba(255, 255, 255, 0.98);
  width: 100%;
  max-width: 960px;
  min-height: 540px;
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  overflow: hidden;
  padding: 40px;
  gap: 10px;
}

@media (max-width: 768px) {
  .login-card {
    grid-template-columns: 1fr;
    padding: 30px 20px;
    gap: 25px;
  }
  .divider {
    display: none;
  }
}

/* Sección de Identidad de Marca */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 20px;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.brand-logo {
  width: 130px;
  height: auto;
  object-fit: contain;
}

.brand-name {
  font-size: 2.3rem;
  font-weight: 700;
  color: #111111;
  margin: 12px 0 0 0;
}

.brand-tagline {
  font-size: 1rem;
  color: #555555;
  max-width: 260px;
  line-height: 1.4;
  margin: 0;
}

/* Línea divisoria */
.divider {
  width: 1px;
  height: 80%;
  background-color: #e2e8f0;
}

/* Formulario y Campos de entrada */
.form-section {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111111;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.error-banner {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  font-weight: 500;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  display: flex;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #0a52be;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  cursor: pointer;
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #0a52be;
  cursor: pointer;
}

.forgot-link {
  color: #0a52be;
  text-decoration: none;
  font-weight: 600;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Botón estilo NovaFacts */
.submit-button {
  background-color: #0a52be;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 5px;
}

.submit-button:hover {
  background-color: #08439e;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
</style>
