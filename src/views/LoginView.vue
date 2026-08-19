<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-container">
      <div class="login-card card-glass">
        <div class="login-header">
          <div class="login-icon">⛪</div>
          <h1 class="login-title">Estaca La Serena</h1>
          <p class="login-subtitle">Sistema de Gestión de Contenido Instagram</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" v-model="email" placeholder="correo@estaca.cl" required />
          </div>

          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" v-model="password" placeholder="••••••••" required />
          </div>

          <p v-if="error" class="login-error">{{ error }}</p>

          <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <div class="login-demo">
          <p class="demo-title">Cuentas de demostración:</p>
          <button class="demo-btn" @click="fillDemo('creador@estaca.cl')">
            <span class="demo-role">📝 Creador</span>
            <span class="demo-email">creador@estaca.cl</span>
          </button>
          <button class="demo-btn" @click="fillDemo('aprobador@estaca.cl')">
            <span class="demo-role">✅ Aprobador</span>
            <span class="demo-email">aprobador@estaca.cl</span>
          </button>
          <p class="demo-pass">Contraseña: admin123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function fillDemo(demoEmail) {
  email.value = demoEmail
  password.value = 'admin123'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--gray-2);
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(0, 125, 165, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 70%, rgba(0, 97, 132, 0.04) 0%, transparent 50%);
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-detached);
  padding: 44px 36px;
  animation: fadeIn 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.login-header {
  text-align: center;
  margin-bottom: var(--sp-32);
}

.login-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--sp-16);
  background: var(--accent-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  color: white;
}

.login-title {
  font: 700 1.4rem/1.3 var(--font-serif);
  color: var(--text-primary);
}

.login-subtitle {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-weight: 300;
  margin-top: 6px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
}

.login-error {
  color: var(--accent-danger);
  font-size: 0.8125rem;
  text-align: center;
  padding: var(--sp-8);
  background: #fde8e8;
  border-radius: var(--radius-sm);
}

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 0.9375rem;
  margin-top: var(--sp-4);
}

.login-demo {
  margin-top: var(--sp-24);
  padding-top: var(--sp-24);
  border-top: 1px solid var(--border-tertiary);
}

.demo-title {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--sp-8);
  text-align: center;
}

.demo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-level1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  margin-bottom: 6px;
  transition: all var(--transition-fast);
  min-height: 44px;
}

.demo-btn:hover {
  border-color: var(--accent-primary);
  background: #e0f4f8;
  color: var(--text-primary);
}

.demo-btn:active {
  transform: scale(0.98);
  transition-duration: 60ms;
}

.demo-role { font-weight: 600; }
.demo-email { font-family: monospace; font-size: 0.78rem; }

.demo-pass {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: var(--sp-8);
}
</style>
