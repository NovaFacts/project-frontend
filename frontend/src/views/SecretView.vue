<template>
  <div class="secret-view">
    <SecretDisplay 
      v-if="secretPhrase" 
      :secretPhrase="secretPhrase" 
      @logout="handleLogout" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SecretDisplay from '../components/SecretDisplay.vue';

const route = useRoute();
const router = useRouter();
const secretPhrase = ref('');

// Equivalente a created() / mounted() en Composition API
onMounted(() => {
  // Extraemos la frase de los query parameters (?phrase=...)
  const phrase = route.query.phrase;

  if (!phrase) {
    // Redirección de seguridad: si intentan entrar directo a la URL sin loguearse
    router.push('/');
  } else {
    secretPhrase.value = phrase;
  }
});

const handleLogout = () => {
  // Limpiamos la variable y regresamos al login
  secretPhrase.value = '';
  router.push('/');
};
</script>

<style scoped>
.secret-view {
  width: 100%;
  min-height: 100vh;
}
</style>
