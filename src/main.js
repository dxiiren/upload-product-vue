import './assets/main.css'
import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/'
import VeeValidationPlugin from './includes/validation'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VeeValidationPlugin);

app.mount('#app')
