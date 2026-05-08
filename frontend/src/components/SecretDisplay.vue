<template>
  <div class="success-wrapper">
    <div class="success-card">
      <div class="check-icon">✓</div>
      
      <h2 class="title">¡Login Exitoso!</h2>
      
      <p class="description">Esta es tu frase secreta recuperada del servidor:</p>
      
      <div class="secret-box">
        {{ secretPhrase }}
      </div>

      <button @click="handleLogout" class="btn-logout">
        Cerrar Sesión
      </button>
    </div>
  </div>
</template>

<script setup>
// Definición de Props
const props = defineProps({
  secretPhrase: {
    type: String,
    required: true
  }
});

// Definición de Eventos
const emit = defineEmits(['logout']);

const handleLogout = () => {
  emit('logout');
};
</script>

<style scoped>
/* Fondo gradiente verde (éxito) */
.success-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%);
  padding: 1rem;
}

/* Tarjeta blanca centrada con sombra */
.success-card {
  background-color: #ffffff;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Ícono de check circular */
.check-icon {
  background-color: #f0fff4;
  color: #38a169;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  border: 2px solid #38a169;
  margin-bottom: 0.5rem;
}

.title {
  color: #2d3748;
  margin: 0;
  font-size: 1.75rem;
}

.description {
  color: #718096;
  font-size: 0.95rem;
  margin: 0;
}

/* Frase secreta en caja con borde punteado */
.secret-box {
  width: 100%;
  background-color: #f7fafc;
  border: 2px dashed #48bb78; /* Borde punteado/discontinuo */
  padding: 1.5rem;
  border-radius: 8px;
  color: #276749;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 1.1rem;
  line-height: 1.4;
  word-break: break-word;
}

/* Botón de logout con estilo secundario */
.btn-logout {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background-color: #edf2f7;
  color: #4a5568;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: #e2e8f0;
  color: #2d3748;
  border-color: #a0aec0;
  transform: translateY(-1px);
}

.btn-logout:active {
  transform: translateY(0);
}
</style>
