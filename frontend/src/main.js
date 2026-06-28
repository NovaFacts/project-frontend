import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/shared.css'

// Inicialización de la instancia de Vue
const app = createApp(App)

// Inyectar el router en la aplicación
app.use(router)

// Montar la aplicación en el DOM (index.html)
app.mount('#app')
