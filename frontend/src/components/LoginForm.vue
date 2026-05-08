<template>
  <div class="login-wrapper">
    <form @submit.prevent="handleSubmit" class="login-card">
      <h2 class="title">Acceso al Sistema</h2>
      
      <div class="input-group">
        <label for="correo">Correo Electrónico</label>
        <input 
          type="email" 
          id="correo" 
          v-model="correo" 
          required 
          placeholder="estudiante@universidad.edu.co"
        />
      </div>

      <div class="input-group">
        <label for="password">Contraseña</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required 
          placeholder="Ingresa tu contraseña"
        />
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../services/authService'; // Ajusta la ruta si es necesario

// Definición de datos reactivos
const correo = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

// Definición del evento que se emitirá a la Vista principal
const emit = defineEmits(['login-success']);

const handleSubmit = async () => {
  // 1. Activar carga y limpiar errores previos
  loading.value = true;
  errorMessage.value = '';

  // 2. Llamar al servicio HTTP
  const result = await authService.login(correo.value, password.value);

  // 3. Evaluar respuesta
  if (result.success) {
    // Si hay éxito, el componente delega la redirección al padre enviando la frase
    emit('login-success', result.secret_phrase);
  } else {
    // Si falla, muestra el error localmente
    errorMessage.value = result.message || 'Error de conexión con el servidor.';
  }

  // 4. Desactivar carga
  loading.value = false;
};
</script>

<style scoped>
/* Contenedor: centrado vertical y horizontal con fondo gradiente */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

/* Formulario: fondo blanco, padding, border-radius, sombra */
.login-card {
  background-color: #ffffff;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.title {
  text-align: center;
  margin: 0;
  color: #333;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

/* Inputs: bordes suaves, padding, efecto focus con color */
input {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

/* Botón: gradiente, color blanco, efecto hover */
button {
  padding: 1rem;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.3s ease;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.4);
  transform: translateY(-1px);
}

button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Error: fondo rojo claro, texto rojo, padding */
.error-box {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
  border: 1px solid #fca5a5;
}
</style>
