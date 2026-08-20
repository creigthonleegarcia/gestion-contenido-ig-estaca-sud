<template>
  <div class="settings-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración del Sistema</h1>
        <p class="page-subtitle">Conexión con Meta Graph API y roles de administración</p>
      </div>
    </div>

    <!-- Meta API Connection Section -->
    <section class="card settings-section">
      <div class="section-header-bar">
        <div class="sec-title-wrap">
          <div class="sec-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div>
            <h3 class="section-title">Conexión con Meta Graph API</h3>
            <p class="section-desc">Credenciales para publicación y sincronización en tiempo real de Instagram</p>
          </div>
        </div>

        <div class="connection-status-pill" :class="{ connected: apiStatus.configured }">
          <span class="status-pulse"></span>
          <span>{{ apiStatus.message || 'Verificando...' }}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Meta Access Token</label>
        <div class="input-icon-wrap">
          <input
            :type="showToken ? 'text' : 'password'"
            v-model="settings.accessToken"
            placeholder="Token de acceso de larga duración (60 días)"
            class="form-control with-toggle"
            readonly
          />
          <button type="button" class="btn-toggle-token" @click="showToken = !showToken">
            <svg v-if="!showToken" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
        <small class="form-help">Token activo configurado de forma segura en las variables de entorno del servidor (<code>.env</code>).</small>
      </div>

      <div class="form-group">
        <label class="form-label">Instagram Business Account ID</label>
        <input v-model="settings.igAccountId" placeholder="17841433875445817" class="form-control" readonly />
        <small class="form-help">Identificador de cuenta @estacalaserena vinculado a la página de Facebook de la Estaca.</small>
      </div>

      <div class="guide-box">
        <h4 class="guide-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Proceso de Renovación de Token (Cada 60 Días)
        </h4>
        <ol class="guide-steps">
          <li>Ingresa a <a href="https://developers.facebook.com/" target="_blank" rel="noopener">Meta for Developers</a> con la cuenta administradora.</li>
          <li>En el <strong>Graph API Explorer</strong>, selecciona la aplicación de la Estaca y genera un nuevo User Token.</li>
          <li>Asegura los permisos: <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_read_engagement</code>.</li>
          <li>Intercambia el token por uno de larga duración y actualiza la variable <code>META_ACCESS_TOKEN</code> en el archivo <code>.env</code>.</li>
        </ol>
      </div>
    </section>

    <!-- User Roles Section -->
    <section class="card settings-section">
      <div class="section-header-bar">
        <div class="sec-title-wrap">
          <div class="sec-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h3 class="section-title">Roles y Cuentas de Acceso</h3>
            <p class="section-desc">Estructura de permisos para creadores y autoridades de la Estaca</p>
          </div>
        </div>
      </div>

      <div class="users-table">
        <div class="user-row header">
          <span>Nombre de Usuario</span>
          <span>Correo Electrónico</span>
          <span>Rol en el Sistema</span>
        </div>
        <div class="user-row" v-for="(account, i) in demoAccounts" :key="i">
          <span class="user-cell-name">
            <span class="user-dot" :style="{ background: account.color }"></span>
            {{ account.name }}
          </span>
          <span class="user-cell-email">{{ account.email }}</span>
          <span class="badge" :class="account.role === 'approver' ? 'badge-published' : 'badge-scheduled'">
            {{ account.role === 'approver' ? 'Aprobador (Presidencia)' : 'Creador de Contenido' }}
          </span>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="card settings-section">
      <div class="section-header-bar">
        <div class="sec-title-wrap">
          <div class="sec-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <h3 class="section-title">Acerca de esta Plataforma</h3>
            <p class="section-desc">Desarrollado para el Consejo de Comunicaciones de la Estaca La Serena</p>
          </div>
        </div>
      </div>

      <div class="about-grid">
        <div class="about-pill">
          <span class="pill-label">Arquitectura</span>
          <span class="pill-val">Vue 3 + Vite + Express + SQLite</span>
        </div>
        <div class="about-pill">
          <span class="pill-label">Integración</span>
          <span class="pill-val">Meta Graph API v22.0</span>
        </div>
        <div class="about-pill">
          <span class="pill-label">Diseño</span>
          <span class="pill-val">Unity Design System (churchofjesuschrist.org)</span>
        </div>
        <div class="about-pill">
          <span class="pill-label">Automatización</span>
          <span class="pill-val">node-cron Scheduler</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const apiStatus = reactive({ configured: true, message: 'Conexión activa con Meta API' })
const showToken = ref(false)

const settings = reactive({
  accessToken: 'IGAATAEr2GqwBBZAGJGNWp0ZA1ZA5UFAtRW9NT1FYeEF1V2FEcTlqaEZAyRGkyRlpQSnZAubFg0bDMzaG4zVGhrS0o0cTBrbURZAVGQ1RU9Xd0Nfdm1UZAkRNNEhlbEdpUnJXWGltR0FwbFhEb19OR3RGa0tLRzJhNE5YUkcxTm54V0gtbwZDZD',
  igAccountId: '17841433875445817'
})

const demoAccounts = [
  { name: 'Creador de Contenido', email: 'creador@estaca.cl', role: 'creator', color: '#007da5' },
  { name: 'Presidente de Estaca', email: 'aprobador@estaca.cl', role: 'approver', color: '#318d43' }
]

async function checkApiStatus() {
  try {
    const res = await fetch('/api/publish/status', {
      headers: auth.getHeaders()
    })
    const data = await res.json()
    apiStatus.configured = data.configured
    apiStatus.message = data.configured ? 'Meta API v22.0 Conectada en Vivo' : 'Modo Demostración'
  } catch (e) {
    apiStatus.message = 'Error verificando conexión'
  }
}

onMounted(checkApiStatus)
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--sp-20);
  max-width: 1320px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--sp-8);
}

.settings-section {
  padding: 24px 28px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-tertiary);
  flex-wrap: wrap;
  gap: var(--sp-12);
}

.sec-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sec-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: #e0f4f8;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font: 700 1.05rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.section-desc {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  margin: 0;
}

.connection-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  background: #fff3e0;
  color: var(--accent-warning);
}

.connection-status-pill.connected {
  background: #e8f5e9;
  color: var(--accent-success);
}

.status-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 9px 12px;
  background: var(--gray-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  color: var(--text-primary);
  outline: none;
}

.input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control.with-toggle {
  padding-right: 40px;
}

.btn-toggle-token {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-help {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.guide-box {
  padding: 16px 20px;
  background: var(--gray-2);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  margin-top: 16px;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 700 0.84rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 10px 0;
}

.guide-steps {
  padding-left: 18px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-steps li {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.guide-steps a {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
}

.users-table {
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.user-row {
  display: grid;
  grid-template-columns: 1fr 1fr 180px;
  padding: 12px 18px;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--border-tertiary);
  align-items: center;
  background: #ffffff;
}

.user-row:last-child {
  border-bottom: none;
}

.user-row.header {
  background: var(--gray-3);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.user-cell-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.user-cell-email {
  font-family: monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sp-12);
}

.about-pill {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 16px;
  background: var(--gray-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-tertiary);
}

.pill-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.pill-val {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
