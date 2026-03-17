<template>
  <div class="container">

    <form class="login-card" @submit.prevent="handleSubmit">

      <h2>Login</h2>

      <input
        type="email"
        placeholder="Correo"
        v-model="correo"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        v-model="password"
        required
      />

      <div v-if="errorMessage" class="error">
        {{ errorMessage }}
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Ingresando..." : "Ingresar" }}
      </button>

    </form>

  </div>
</template>

<script>
import authService from "../services/authService"

export default {

  data() {
    return {
      correo: "",
      password: "",
      loading: false,
      errorMessage: ""
    }
  },

  methods: {

    async handleSubmit() {

      this.loading = true
      this.errorMessage = ""

      const result = await authService.login(this.correo, this.password)

      if (result.success) {

        this.$emit("login-success", result.secret_phrase)

      } else {

        this.errorMessage = result.message
      }

      this.loading = false
    }
  }
}
</script>

<style scoped>

.container{
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  background:linear-gradient(135deg,#667eea,#764ba2);
}

.login-card{
  background:white;
  padding:40px;
  border-radius:10px;
  width:300px;
  box-shadow:0 10px 30px rgba(0,0,0,0.2);
  display:flex;
  flex-direction:column;
  gap:10px;
}

input{
  padding:10px;
  border-radius:5px;
  border:1px solid #ccc;
}

button{
  padding:10px;
  border:none;
  background:#667eea;
  color:white;
  border-radius:5px;
  cursor:pointer;
}

.error{
  background:#ffdede;
  color:#a10000;
  padding:10px;
  border-radius:5px;
}

</style>
