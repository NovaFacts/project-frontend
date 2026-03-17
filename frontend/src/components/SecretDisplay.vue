<template>

<div class="success-container">

  <div class="card">

    <h2>✔ Login Exitoso</h2>

    <div class="secret-box">
      {{ secretPhrase }}
    </div>

    <button @click="handleLogout">
      Cerrar sesión
    </button>

  </div>

</div>

</template>

<script>

export default {

  props: {
    secretPhrase: {
      type: String,
      required: true
    }
  },

  methods:{
    handleLogout(){
      this.$emit("logout")
    }
  }

}

</script>

<style scoped>

.success-container{
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  background:linear-gradient(135deg,#43cea2,#185a9d);
}

.card{
  background:white;
  padding:40px;
  border-radius:10px;
  text-align:center;
}

.secret-box{
  margin:20px 0;
  padding:15px;
  border:2px dashed #43cea2;
}

button{
  padding:10px;
  background:#333;
  color:white;
  border:none;
  border-radius:5px;
}

</style>
