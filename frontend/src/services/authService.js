import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5177/api"
})

export default {
  async login(correo, password) {
    try {
      const response = await api.post("/login", {
        correo: correo,
        password: password
      })

      return response.data
    } catch (error) {

      if (error.response) {
        return error.response.data
      }

      return {
        success: false,
        message: "Error de conexión con el servidor"
      }
    }
  }
}