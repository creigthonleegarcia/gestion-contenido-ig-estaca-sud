<template>
  <div class="login-page">
    <!-- Left: Hero panel with background image -->
    <div class="hero-panel">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-top">
          <div class="hero-badge">Comité de Comunicaciones</div>
        </div>
        <div class="hero-bottom">
          <blockquote class="hero-quote">
            <p>"Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos."</p>
            <cite>— Mateo 18:20</cite>
          </blockquote>
          <div class="hero-meta">
            <div class="hero-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Estaca La Serena, Chile
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Login form -->
    <div class="form-panel">
      <div class="form-wrapper">
        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-symbol">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/>
              <path d="M5 21V7l7-4 7 4v14"/>
              <path d="M9 21v-6h6v6"/>
              <path d="M10 9h4"/>
              <path d="M12 7v4"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Estaca La Serena</span>
            <span class="brand-sub">Gestión de Contenido Instagram</span>
          </div>
        </div>

        <!-- Welcome -->
        <div class="login-welcome">
          <h1 class="welcome-title">Bienvenido</h1>
          <p class="welcome-desc">Accede al sistema de gestión de contenido para compartir la luz del Evangelio a través de Instagram.</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="login-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="email">Correo electrónico</label>
            <div class="input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="tu@correo.cl"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <div class="input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="!loading">Ingresar</span>
            <span v-else class="btn-loading">
              <span class="spinner-sm"></span>
              Ingresando...
            </span>
          </button>
        </form>

        <!-- Demo accounts -->
        <div class="demo-section">
          <div class="demo-divider">
            <span>Cuentas de demostración</span>
          </div>

          <div class="demo-cards">
            <button class="demo-card" @click="fillDemo('creador@estaca.cl')">
              <div class="demo-avatar" style="background: #007da5;">📝</div>
              <div class="demo-info">
                <span class="demo-role">Creador de Contenido</span>
                <span class="demo-email">creador@estaca.cl</span>
              </div>
              <svg class="demo-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button class="demo-card" @click="fillDemo('aprobador@estaca.cl')">
              <div class="demo-avatar" style="background: #318d43;">✅</div>
              <div class="demo-info">
                <span class="demo-role">Aprobador — Pdte. Estaca</span>
                <span class="demo-email">aprobador@estaca.cl</span>
              </div>
              <svg class="demo-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p>La Iglesia de Jesucristo de los Santos de los Últimos Días</p>
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
const showPassword = ref(false)

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
/* ── Page Layout: Split Screen ── */
.login-page {
  display: flex;
  min-height: 100vh;
  background: #ffffff;
}

/* ── Hero Panel (Left) ── */
.hero-panel {
  flex: 1;
  position: relative;
  display: flex;
  background: url('../assets/login-bg.jpg') center/cover no-repeat;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 32, 57, 0.25) 0%,
    rgba(0, 32, 57, 0.15) 40%,
    rgba(0, 32, 57, 0.55) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  width: 100%;
  color: white;
}

.hero-top {
  display: flex;
  align-items: flex-start;
}

.hero-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
}

.hero-bottom {
  max-width: 500px;
}

.hero-quote {
  margin: 0 0 24px;
  padding: 0;
  border: none;
}

.hero-quote p {
  font: italic 400 1.65rem/1.45 var(--font-serif);
  margin: 0 0 12px;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
}

.hero-quote cite {
  font-style: normal;
  font-size: 0.85rem;
  font-weight: 300;
  opacity: 0.8;
  letter-spacing: 0.02em;
}

.hero-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 300;
  opacity: 0.7;
}

/* ── Form Panel (Right) ── */
.form-panel {
  width: 480px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #ffffff;
  border-left: 1px solid var(--gray-5);
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
  animation: formEnter 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes formEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.brand-symbol {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  border-radius: var(--radius-sm);
  color: white;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font: 700 0.9rem/1.2 var(--font-serif);
  color: var(--text-primary);
}

.brand-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 400;
}

/* Welcome */
.login-welcome {
  margin-bottom: 32px;
}

.welcome-title {
  font: 700 1.75rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.welcome-desc {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  line-height: 1.6;
  font-weight: 300;
  margin: 0;
}

/* Error */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.8125rem;
  margin-bottom: 20px;
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap svg {
  position: absolute;
  left: 14px;
  color: var(--gray-25);
  transition: color var(--transition-fast);
  pointer-events: none;
}

.input-wrap input {
  width: 100%;
  padding: 11px 14px 11px 42px;
  border: 1px solid var(--gray-10);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  background: var(--gray-2);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input-wrap input:focus {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 125, 165, 0.1);
}

.input-wrap:focus-within svg:first-child {
  color: var(--accent-primary);
}

.input-wrap input::placeholder {
  color: var(--gray-20);
}

.toggle-pw {
  position: absolute;
  right: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--gray-25);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.toggle-pw:hover {
  color: var(--text-primary);
  background: var(--gray-3);
}

/* Login Button */
.btn-login {
  width: 100%;
  padding: 12px 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: var(--shadow-raised);
  min-height: 48px;
}

.btn-login:hover {
  background: var(--accent-primary-hover);
  box-shadow: var(--shadow-detached);
}

.btn-login:active {
  transform: scale(0.97);
  transition-duration: 60ms;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Demo Section */
.demo-section {
  margin-top: 32px;
}

.demo-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.demo-divider::before,
.demo-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--gray-5);
}

.demo-divider span {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.demo-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid var(--gray-5);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 160ms cubic-bezier(0.23, 1, 0.32, 1);
  text-align: left;
  min-height: 56px;
}

.demo-card:hover {
  border-color: var(--accent-primary);
  background: #f0f9fc;
  box-shadow: var(--shadow-raised);
}

.demo-card:active {
  transform: scale(0.98);
  transition-duration: 60ms;
}

.demo-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.demo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.demo-role {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.demo-email {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: monospace;
}

.demo-arrow {
  color: var(--gray-15);
  flex-shrink: 0;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.demo-card:hover .demo-arrow {
  color: var(--accent-primary);
  transform: translateX(2px);
}

/* Footer */
.login-footer {
  margin-top: 40px;
  text-align: center;
}

.login-footer p {
  font-size: 0.6875rem;
  color: var(--gray-20);
  letter-spacing: 0.02em;
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .login-page {
    flex-direction: column;
  }

  .hero-panel {
    min-height: 280px;
    flex: none;
  }

  .hero-quote p {
    font-size: 1.25rem;
  }

  .form-panel {
    width: 100%;
    padding: 32px 24px;
    border-left: none;
    border-top: 1px solid var(--gray-5);
  }
}
</style>
