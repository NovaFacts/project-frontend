<template>
  <div class="login-view">
    <LoginForm @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import LoginForm from '../components/LoginForm.vue';

const router = useRouter();

/**
 * Maneja el éxito del login
 * @param {string} secretPhrase - Frase recuperada del backend
 */
const handleLoginSuccess = (secretPhrase) => {
  // Navegamos a la ruta /secret. 
  // Pasamos la frase como parámetro de consulta (query) 
  // para que SecretView pueda leerla fácilmente.
  router.push({
    path: '/secret',
    query: { phrase: secretPhrase }
  });
};
</script>

<style scoped>
.login-view {
  width: 100%;
  height: 100vh;
}
</style>
