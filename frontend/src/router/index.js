import { createRouter, createWebHistory } from "vue-router"

import LoginView from "../views/LoginView.vue"
import SecretView from "../views/SecretView.vue"

const routes = [

  {
    path:"/",
    component:LoginView
  },

  {
    path:"/secret/:secretPhrase?",
    component:SecretView
  }

]

const router = createRouter({
  history:createWebHistory(),
  routes
})

export default router